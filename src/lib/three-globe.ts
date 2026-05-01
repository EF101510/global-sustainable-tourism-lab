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
 * Procedural "tech earth" canvas texture: blue ocean gradient + dark-blue
 * continents with cyan stroke + Antarctica ice cap + subtle digital noise.
 * Used as the immediate texture before TopoJSON coastlines load.
 */
export function createTechEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const W = 2048;
  const H = 1024;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Ocean
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#5d8ab1');
  grad.addColorStop(0.5, '#7fa9cc');
  grad.addColorStop(1, '#5d8ab1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const xy = (lng: number, lat: number): [number, number] => [
    ((lng + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];

  const land = '#1e3a5f';
  const landStroke = '#9cd1ec';

  const drawShape = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([lng, lat], i) => {
      const [x, y] = xy(lng, lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = land;
    ctx.fill();
    ctx.strokeStyle = landStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // North America
  drawShape([
    [-167,65],[-160,55],[-153,57],[-148,60],[-143,60],[-138,59],
    [-133,55],[-128,52],[-125,49],[-124,46],[-124,42],[-122,38],
    [-120,34],[-117,33],[-115,29],[-112,25],[-109,23],[-106,21],
    [-100,18],[-96,16],[-93,15],[-91,16],[-88,16],[-87,13],[-85,11],
    [-83,9],[-79,9],[-77,8],[-77,12],[-78,18],[-86,21],[-90,21],
    [-94,19],[-97,22],[-97,26],[-95,29],[-90,30],[-87,30],[-83,29],
    [-82,27],[-80,25],[-80,29],[-81,32],[-77,35],[-76,38],[-74,40],
    [-72,41],[-70,42],[-67,44],[-66,45],[-63,46],[-59,47],[-55,46],
    [-53,48],[-55,52],[-58,54],[-63,57],[-65,60],[-78,60],[-78,68],
    [-72,73],[-80,75],[-95,77],[-115,75],[-125,71],[-135,69],
    [-145,70],[-155,71],[-165,68]
  ]);

  // Greenland
  drawShape([
    [-52,60],[-44,60],[-38,62],[-22,68],[-15,75],[-22,82],[-32,83],
    [-45,83],[-55,80],[-58,73],[-55,65],[-52,62]
  ]);

  // Iceland
  drawShape([[-24,64],[-22,66],[-14,66],[-13,65],[-15,63],[-20,63]]);

  // Cuba
  drawShape([[-84,22],[-77,22],[-74,21],[-77,20],[-83,21]]);

  // Hispaniola
  drawShape([[-74,19],[-68,19],[-68,17],[-72,17.5]]);

  // South America
  drawShape([
    [-78,12],[-72,11],[-65,10],[-60,9],[-55,5],[-52,4],[-48,1],
    [-44,-1],[-38,-5],[-35,-8],[-35,-13],[-37,-18],[-40,-22],
    [-43,-23],[-45,-25],[-48,-28],[-53,-32],[-58,-35],[-62,-38],
    [-65,-42],[-68,-45],[-71,-48],[-73,-52],[-74,-55],[-72,-54],
    [-72,-50],[-72,-44],[-74,-40],[-75,-35],[-76,-30],[-72,-25],
    [-71,-20],[-72,-15],[-77,-10],[-80,-5],[-80,-2],[-78,2],[-78,5]
  ]);

  // Eurasia (Europe + Asia, with Italy peninsula traced)
  drawShape([
    [-9,37],[-9,43],[-1,47],[-2,49],[2,51],[4,53],[8,54],[11,55],
    [11,58],[10,62],[13,68],[18,70],[29,71],
    [33,69],[40,67],[55,68],[70,72],[85,74],[100,76],[115,76],
    [130,73],[150,72],[170,70],[178,71],
    [178,66],[170,62],[165,58],[155,53],[142,47],
    [129,40],[126,35],
    [122,37],[121,32],[118,25],[110,21],
    [108,16],[105,9],
    [104,1],
    [99,7],[98,13],[95,17],
    [92,22],[88,22],[85,19],[80,13],[78,8],
    [73,8],[73,17],[68,23],
    [60,25],[55,25],
    [58,22],[55,18],
    [50,12],[44,12],
    [42,16],[38,22],[35,28],
    [33,30],[34,31],
    [35,35],[36,36],
    [33,36],[30,37],[27,37],
    [22,38],[20,40],
    [16,42],[13,45],
    [12,45],[13,43],[16,41],[18,40],[17,38],[15,38],[12,41],[10,44],
    [7,43],[3,42],[-1,39],[-2,36],
    [-5,36]
  ]);

  // Africa
  drawShape([
    [-17,15],[-17,21],[-12,28],[-7,33],[-3,35],[3,36],[10,33],
    [11,33],[15,32],[20,31],[25,32],[30,31],[33,31],[34,30],[35,28],
    [37,22],[39,15],[42,12],[45,11],[48,11],[51,11],
    [52,11],[51,8],[50,5],[44,1],[42,-1],[40,-5],
    [40,-10],[40,-15],[37,-18],[35,-22],[35,-25],[33,-28],[32,-29],
    [28,-33],[25,-34],[22,-34],[18,-34],[16,-29],
    [13,-23],[13,-18],[12,-15],[12,-10],[10,-5],[8,0],
    [9,4],[6,5],[3,5],[0,5],[-5,4],[-8,4],[-13,8],[-15,12]
  ]);

  // Madagascar
  drawShape([[43,-12],[48,-12],[50,-15],[50,-22],[47,-25],[44,-22],[43,-17]]);

  // Australia
  drawShape([
    [113,-22],[114,-26],[115,-32],[118,-35],[125,-32],[128,-32],
    [132,-32],[138,-35],[140,-38],[145,-39],[148,-37],[150,-35],
    [153,-30],[153,-25],[146,-19],[143,-13],[140,-12],[135,-12],
    [130,-13],[125,-15],[122,-17],[120,-18],[115,-20]
  ]);

  // Tasmania
  drawShape([[144,-41],[148,-40],[148,-43],[144,-43]]);

  // New Zealand (two islands)
  drawShape([[172,-34],[177,-37],[178,-39],[174,-41],[170,-40]]);
  drawShape([[166,-46],[171,-44],[174,-46],[170,-47],[167,-47]]);

  // Sumatra / Borneo / Sulawesi / Java / New Guinea / Philippines
  drawShape([[95,5],[101,3],[105,-2],[103,-5],[100,0],[97,2]]);
  drawShape([[109,2],[114,6],[119,3],[118,-3],[114,-3],[110,-2]]);
  drawShape([[120,2],[124,1],[125,-2],[123,-5],[121,-2]]);
  drawShape([[105,-7],[114,-7],[114,-9],[106,-9]]);
  drawShape([[131,-1],[140,-3],[150,-7],[148,-10],[140,-9],[132,-5]]);
  drawShape([[120,18],[124,18],[126,12],[125,7],[120,9],[118,12]]);

  // Japan
  drawShape([[140,42],[145,44],[145,42],[141,41]]);
  drawShape([[131,34],[136,34],[140,36],[141,38],[140,40],[135,36],[131,33]]);
  drawShape([[129,32],[131,33],[131,30],[130,30]]);

  // Great Britain & Ireland
  drawShape([[-5,50],[-2,51],[1,51],[1,53],[0,55],[-3,58],[-5,58],[-6,56],[-5,52]]);
  drawShape([[-10,52],[-6,52],[-6,55],[-9,55]]);

  // Sri Lanka
  drawShape([[80,9],[82,9],[82,6],[80,6]]);

  // Antarctica — white ice cap with natural noisy edge
  ctx.fillStyle = '#f0f6fc';
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 15) {
    const noise = Math.sin(x * 0.012) * 35 + Math.sin(x * 0.04) * 18 + Math.sin(x * 0.08) * 8;
    ctx.lineTo(x, H - 90 + noise);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c5d5e5';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle digital noise
  for (let i = 0; i < 25000; i++) {
    const px = Math.random() * W;
    const py = Math.random() * H;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
    ctx.fillRect(px, py, 2, 2);
  }

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
