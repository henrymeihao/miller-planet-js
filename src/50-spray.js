// ---- spray, drawn on threes: plumes blown off the crest, mist boiling at the toe, the Ranger's downwash
function buildSpray(scene) {
  const rng = new Rng(9);
  const CREST_N = 420, TOE_N = 300, WASH_N = 160;
  const P = [];
  for (let i = 0; i < CREST_N; i++) P.push({ kind: 0, x: rng.range(-1100, 1100), ph: rng.next(), life: rng.range(1.2, 2.0), s: rng.range(0.03, 0.08), dz: rng.range(-0.05, 0.12), up: rng.range(0.05, 0.3) });
  for (let i = 0; i < TOE_N; i++) P.push({ kind: 1, x: rng.range(-1100, 1100), ph: rng.next(), life: rng.range(1.0, 1.8), s: rng.range(0.06, 0.14), dz: rng.range(-0.05, 0.1), up: rng.range(0.02, 0.1) });
  for (let i = 0; i < WASH_N; i++) { const a = rng.range(0, Math.PI * 2); P.push({ kind: 2, a, ph: rng.next(), life: rng.range(0.6, 1.1), s: rng.range(0.6, 1.6), sp: rng.range(8, 20) }); }
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), celMat('#ffffff', 101, { mode: 1 }), P.length);
  mesh.frustumCulled = false; scene.add(mesh);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    // ems: ground emitters [{ x, y, z, on, size }] (the Ranger's downwash, CASE's wake)
    update(st, ems, cam) {
      const t = onThrees(st.t), zW = WAVE.z(t), H = WAVE.H(t), k = WAVE.lean(t);
      const crestOn = smooth(invLerp(28, 36, t)), toeOn = smooth(invLerp(22, 32, t));
      P.forEach((p, i) => {
        if (p.kind === 2) {
          const em = ems[i % ems.length];
          const on = em.on;
          const a = ((t / p.life + p.ph) % 1);
          if (on < 0.05) { mesh.setMatrixAt(i, ZERO); return; }
          const r = (4 + a * p.sp) * em.size;
          V.set(em.x + Math.cos(p.a) * r, (0.5 + a * 3) * em.size, em.z + Math.sin(p.a) * r);
          const s = p.s * on * em.size * (0.5 + a) * (1 - a * a);
          M.compose(V, Q.identity(), S.set(s * 1.3, s * 0.45, s * 1.3)); mesh.setMatrixAt(i, M); return;
        }
        const a = ((t / p.life + p.ph) % 1), Hx = H * ridge(p.x), zb = zW + waveBend(p.x, H);
        let on, s;
        if (p.kind === 0) {
          on = crestOn;
          // born on the lip, blown back over the crest and up
          V.set(p.x, Hx * (1.0 + 0.03 * k + a * p.up), zb + Hx * (0.1 + 0.25 * k + p.dz - a * 0.35));
          s = p.s * Hx * (0.4 + a) * (1 - a * a);
        } else {
          on = toeOn;
          V.set(p.x, Hx * a * p.up, zb + Hx * (0.5 + p.dz + a * 0.06));
          s = p.s * Hx * (0.5 + a) * (1 - a * a);
        }
        if (on < 0.02 || V.distanceTo(cam) < s * 3 + 120) { mesh.setMatrixAt(i, ZERO); return; }
        s *= on;
        M.compose(V, Q.identity(), p.kind === 1 ? S.set(s * 1.6, s * 0.55, s) : S.set(s * 1.3, s * 0.8, s)); mesh.setMatrixAt(i, M);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
