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
  grad.addColorStop(0, '#5d8ab1');
  grad.addColorStop(0.5, '#7fa9cc');
  grad.addColorStop(1, '#5d8ab1');
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
      g.addColorStop(0, '#5d8ab1');
      g.addColorStop(0.5, '#7fa9cc');
      g.addColorStop(1, '#5d8ab1');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const drawPoly = (rings: [number, number][][]) => {
        if (!rings || !rings[0] || rings[0].length < 3) return;
        ctx.beginPath();
        rings[0].forEach(([lng, lat], i) => {
          const x = ((lng + 180) / 360) * W;
          const y = ((90 - lat) / 180) * H;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = '#1e3a5f';
        ctx.fill();
        ctx.strokeStyle = '#9cd1ec';
        ctx.lineWidth = 2;
        ctx.stroke();
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
