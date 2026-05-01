import * as THREE from 'three';

export function latLngToVec3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Plain blue ocean canvas texture used as a placeholder before
 * `upgradeWithTopoJSON` swaps in real coastlines (~300 ms later).
 * No continents are drawn — if TopoJSON fails on every CDN, the globe
 * stays as a solid blue sphere rather than showing a hand-drawn fallback.
 */
export function createOceanTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const W = 2048;
  const H = 1024;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#9ec4e2');
  grad.addColorStop(0.5, '#c1ddee');
  grad.addColorStop(1, '#9ec4e2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  return new THREE.CanvasTexture(canvas);
}


/**
 * Fetch a world-atlas TopoJSON land outline and replace the given material's
 * texture with a higher-fidelity rasterisation. Fire-and-forget; failures
 * leave the procedural texture in place.
 */
export async function upgradeWithTopoJSON(material: THREE.MeshBasicMaterial): Promise<void> {
  const urls = [
    'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json',
    'https://unpkg.com/world-atlas@2/land-110m.json',
    'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const topo = await res.json();
      const obj = topo.objects.land;
      const arcs = topo.arcs;
      const { scale, translate } = topo.transform;

      const decodeArc = (a: [number, number][]): [number, number][] => {
        const pts: [number, number][] = [];
        let x = 0;
        let y = 0;
        for (const d of a) {
          x += d[0];
          y += d[1];
          pts.push([x * scale[0] + translate[0], y * scale[1] + translate[1]]);
        }
        return pts;
      };
      const expand = (idxs: number[]): [number, number][] => {
        const out: [number, number][] = [];
        for (const i of idxs) {
          const rev = i < 0;
          let a = decodeArc(arcs[rev ? ~i : i]);
          if (rev) a = a.slice().reverse();
          if (out.length) a = a.slice(1);
          out.push(...a);
        }
        return out;
      };

      const W = 2048;
      const H = 1024;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d')!;

      // Ocean
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#9ec4e2');
      g.addColorStop(0.5, '#c1ddee');
      g.addColorStop(1, '#9ec4e2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Project a (lng, lat) pair to canvas coordinates. lng is expected
      // already-normalised to [-180, 180]; lat to [-90, 90].
      const project = (lng: number, lat: number): [number, number] => [
        ((lng + 180) / 360) * W,
        ((90 - lat) / 180) * H,
      ];

      // Split a ring at antimeridian crossings (where consecutive points
      // differ in longitude by > 180°). At each crossing we close the
      // current sub-ring by walking up/over the pole along the canvas
      // edge, and start a new sub-ring on the other side. This prevents
      // the diagonal "shortcut" strokes that produce the concentric ring
      // artifacts at the North Pole (and elsewhere).
      const splitRingAtAntimeridian = (
        ring: [number, number][]
      ): [number, number][][] => {
        if (ring.length < 2) return [ring];
        const subs: [number, number][][] = [];
        let current: [number, number][] = [];
        for (let i = 0; i < ring.length; i++) {
          const [lng, lat] = ring[i];
          if (i === 0) {
            current.push([lng, lat]);
            continue;
          }
          const [pLng, pLat] = ring[i - 1];
          const dLng = lng - pLng;
          if (Math.abs(dLng) > 180) {
            // Antimeridian crossing. Compute the latitude at which the
            // segment crosses ±180 by linear interpolation in a frame
            // where we shift the wrapped point by ±360 to be continuous.
            const adjLng = lng + (dLng > 0 ? -360 : 360);
            const total = adjLng - pLng;
            const tEdgeLng = pLng < 0 ? -180 : 180;
            const t = total !== 0 ? (tEdgeLng - pLng) / total : 0;
            const crossLat = pLat + (lat - pLat) * t;

            // Decide which pole this segment likely wraps over: if the
            // crossing latitude is closer to the north pole than the
            // south, use +90 as the wrap edge. This makes Arctic-spanning
            // polygons walk along the top of the canvas instead of
            // cutting diagonally.
            const poleLat = crossLat >= 0 ? 90 : -90;
            const exitLng = pLng < 0 ? -180 : 180;
            const enterLng = -exitLng;

            // Close current sub-ring by going to the edge, then up to
            // the pole corner.
            current.push([exitLng, crossLat]);
            current.push([exitLng, poleLat]);
            current.push([enterLng, poleLat]);
            current.push([enterLng, crossLat]);
            subs.push(current);
            current = [[enterLng, crossLat], [lng, lat]];
          } else {
            current.push([lng, lat]);
          }
        }
        if (current.length >= 3) subs.push(current);
        return subs;
      };

      const strokeRing = (ring: [number, number][]) => {
        // Stroke only the original (non-pole-edge) segments so we don't
        // draw a hard line along the canvas top/bottom or the antimeridian.
        ctx.beginPath();
        let penDown = false;
        for (let i = 0; i < ring.length; i++) {
          const [lng, lat] = ring[i];
          const onPole = lat >= 90 - 1e-6 || lat <= -90 + 1e-6;
          const onAnti = Math.abs(Math.abs(lng) - 180) < 1e-6;
          const [x, y] = project(lng, lat);
          if (onPole || onAnti) {
            penDown = false;
            continue;
          }
          if (!penDown) {
            ctx.moveTo(x, y);
            penDown = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = '#cfe7f5';
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      const drawPoly = (rings: [number, number][][]) => {
        if (!rings || !rings[0] || rings[0].length < 3) return;
        const outer = rings[0];
        const subs = splitRingAtAntimeridian(outer);
        // Fill all sub-rings as a single path (handles donut/holes via
        // even-odd if needed, though world-atlas outer ring usually
        // doesn't have holes for land).
        ctx.beginPath();
        for (const sub of subs) {
          sub.forEach(([lng, lat], i) => {
            const [x, y] = project(lng, lat);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
        }
        ctx.fillStyle = '#4a78a3';
        ctx.fill('evenodd');
        // Stroke the original ring (not the pole-edge fillers) for a
        // clean coastline.
        for (const sub of subs) strokeRing(sub);
      };

      const drawGeom = (geom: any) => {
        if (!geom) return;
        if (geom.type === 'MultiPolygon') {
          for (const poly of geom.arcs) drawPoly(poly.map(expand));
        } else if (geom.type === 'Polygon') {
          drawPoly(geom.arcs.map(expand));
        } else if (geom.type === 'GeometryCollection' && geom.geometries) {
          for (const sub of geom.geometries) drawGeom(sub);
        }
      };
      drawGeom(obj);

      for (let i = 0; i < 18000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      }

      const newTex = new THREE.CanvasTexture(c);
      material.map = newTex;
      material.needsUpdate = true;
      return;
    } catch (e) {
      console.warn('Coastline source failed:', url, (e as Error)?.message);
    }
  }
}
