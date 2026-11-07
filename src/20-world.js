// ---- world: overcast sky, a mirror of shallow water, and the waves. The camera looks roughly -Z.
const U = {
  uKey: { value: new THREE.Vector3(-0.4, 0.75, 0.5).normalize() },   // character key (anime cheat): soft, from above-front
  uShade: { value: new THREE.Color('#aab0d0') },
  uSun: { value: new THREE.Vector3(-0.3, 0.5, -0.8).normalize() },
  uFog: { value: new THREE.Color('#bccbd6') },
  uWave: { value: new THREE.Vector4(-2800, 250, 0, 0) },
  uTime: { value: 0 }, uDraw: { value: 0 },
};

// The wave: crest line z, height and lean. Far away it reads as a mountain range; it passes under the Ranger at ~44 s.
const WAVE = {
  z: (t) => track([[0, -2900], [10, -2800, lin], [12.4, -2450, lin], [20, -1750, lin], [30, -900, lin], [35, -420, lin], [38, -330, lin],
    [40.3, -250, lin], [42.8, -174, lin], [44.6, -48, lin], [47, 300, lin], [51, 1500, lin], [54, 2000, lin]], t),
  H: (t) => track([[0, 250], [40, 255]], t),
  lean: (t) => track([[0, 0], [30, 0.05], [42, 0.2], [46, 0.25]], t),
};
// the next one, waiting on the horizon after the first has passed
const WAVE2 = { z: () => -3300, H: () => 262, lean: () => 0 };

const ridge = (x) => 0.80 + 0.11 * Math.sin(x * 0.0021 + 1.3) + 0.07 * Math.sin(x * 0.0057 + 4.1) + 0.04 * Math.sin(x * 0.011 + 2.0) + 0.025 * Math.sin(x * 0.027 + 0.7);
const waveBend = (x, H) => noise1(x / 700, 2) * 0.3 * H;                // the wall is not straight
const leanMix = (x) => 0.5 + 0.5 * noise1(x / 500, 5);

// cross-section in units of H: d (+ toward camera), y. Index 5 is the crest, 11 the toe.
function profilePts(k) {
  return [[-8, 0], [-4.5, 0.2], [-2.2, 0.6], [-0.9, 0.9], [-0.25, 1.0], [0.1 + 0.25 * k, 1.0 + 0.03 * k],
    [0.32 + 0.55 * k, 0.9 - 0.06 * k], [0.28 + 0.45 * k, 0.74 - 0.12 * k], [0.16 + 0.1 * k, 0.55], [0.14, 0.35], [0.24, 0.14], [0.55, 0.0], [1.0, -0.03]]
    .map(([d, y]) => new THREE.Vector2(d, y));
}

// height of the water surface (the top of the wave) at a world point; also its slope along z
const _sp = new THREE.Vector2(), _sq = new THREE.Vector2();
function waveSurface(W, t, x, z) {
  const H = W.H(t), Hx = H * ridge(x), zb = W.z(t) + waveBend(x, H);
  const c = new THREE.SplineCurve(profilePts(W.lean(t) * lerp(0.7, 1, leanMix(x))));
  const heightAt = (d) => {
    let y = 0;
    c.getPoint(0, _sq);
    for (let i = 1; i <= 300; i++) {
      c.getPoint(i / 300, _sp);
      if ((_sq.x - d) * (_sp.x - d) <= 0 && _sp.x !== _sq.x) y = Math.max(y, lerp(_sq.y, _sp.y, (d - _sq.x) / (_sp.x - _sq.x)));
      _sq.copy(_sp);
    }
    return y;
  };
  const d = (z - zb) / Hx, e = 0.02;
  const y = heightAt(d) * Hx;
  return { y, slope: ((heightAt(d + e) - heightAt(d - e)) * Hx) / (2 * e * Hx), d };
}

// front-most face position (units of H) at height fraction y
const _fp = new THREE.Vector2(), _fq = new THREE.Vector2();
function waveFrontD(k, y) {
  const c = new THREE.SplineCurve(profilePts(k));
  let best = -1;
  c.getPoint(5 / 12, _fq);
  for (let i = 1; i <= 200; i++) {
    c.getPoint(5 / 12 + (i / 200) * (7 / 12), _fp);
    if ((_fq.y - y) * (_fp.y - y) <= 0 && _fp.y !== _fq.y) best = Math.max(best, lerp(_fq.x, _fp.x, (y - _fq.y) / (_fp.y - _fq.y)));
    _fq.copy(_fp);
  }
  return best < 0 ? 0.2 : best;
}

// the front-most water at or above height fraction y: a rider there is never inside the overhang
function waveFrontAbove(k, y) {
  const c = new THREE.SplineCurve(profilePts(k));
  let best = -1;
  for (let i = 0; i <= 200; i++) { c.getPoint(4 / 12 + (i / 200) * (7 / 12), _fp); if (_fp.y >= y - 0.04) best = Math.max(best, _fp.x); }
  return best;
}

function buildWave(scene, W, uWave) {
  const NX = 280, NJ = 96;
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(NX * NJ * 3), aJ = new Float32Array(NX * NJ), idx = [];
  const xs = [];
  for (let i = 0; i < NX; i++) { const u = (i / (NX - 1)) * 2 - 1; xs.push(Math.sign(u) * Math.pow(Math.abs(u), 1.6) * 5200); }
  const jOf = (s) => (s < 5 / 12 ? s * 1.2 : 0.5 + (s - 5 / 12) * (0.5 / (7 / 12)));
  for (let i = 0; i < NX; i++) for (let j = 0; j < NJ; j++) aJ[i * NJ + j] = jOf(j / (NJ - 1));
  for (let i = 0; i < NX - 1; i++) for (let j = 0; j < NJ - 1; j++) { const a = i * NJ + j, b = a + 1, c = a + NJ, d = c + 1; idx.push(a, c, b, b, c, d); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aJ', new THREE.BufferAttribute(aJ, 1));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, shaderMat('wave_vs', 'wave_fs', { ...U, uWave }));
  mesh.frustumCulled = false; scene.add(mesh);
  const pa = new THREE.Vector2(), pb = new THREE.Vector2();
  let last = null;
  return {
    mesh,
    update(t) {
      const zW = W.z(t), H = W.H(t), k = W.lean(t);
      uWave.value.set(zW, H, k, 0);
      const key = zW + ':' + H + ':' + k;
      if (key === last) return;
      last = key;
      const A = new THREE.SplineCurve(profilePts(k * 0.7)), B = new THREE.SplineCurve(profilePts(k));
      const prof = [];
      for (let j = 0; j < NJ; j++) { A.getPoint(j / (NJ - 1), pa); B.getPoint(j / (NJ - 1), pb); prof.push([pa.x, pa.y, pb.x, pb.y]); }
      for (let i = 0; i < NX; i++) {
        const x = xs[i], Hx = H * ridge(x), mix = leanMix(x), zb = zW + waveBend(x, H);
        for (let j = 0; j < NJ; j++) {
          const [ad, ay, bd, by] = prof[j], o = (i * NJ + j) * 3;
          pos[o] = x; pos[o + 1] = lerp(ay, by, mix) * Hx; pos[o + 2] = zb + lerp(ad, bd, mix) * Hx;
        }
      }
      g.attributes.position.needsUpdate = true;
      g.computeVertexNormals();
    },
  };
}

function buildWorld(scene) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), shaderMat('sky_vs', 'sky_fs', U, { side: THREE.BackSide, depthWrite: false }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  const seaU = { ...U, uCenter: { value: new THREE.Vector2() }, uWade: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) } };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 420, 420), shaderMat('sea_vs', 'sea_fs', seaU));
  sea.frustumCulled = false; scene.add(sea);
  const wave = buildWave(scene, WAVE, U.uWave);
  const wave2 = buildWave(scene, WAVE2, { value: new THREE.Vector4() });
  return {
    seaU,
    update(st, cam) {
      const td = onTwos(st.t);   // the wave is drawn on twos like a character: it moves in held drawings
      sky.position.copy(cam.position);
      seaU.uCenter.value.set(cam.position.x, cam.position.z);
      wave.update(td);
      wave2.mesh.visible = st.t >= CUES.after;
      if (wave2.mesh.visible) wave2.update(td);
    },
  };
}
