// ---- an astronaut in a white suit (helmet, dark visor, backpack), facing local -Z, ~1.85 m
function buildAstronaut(scene, seed) {
  const root = new THREE.Group(); scene.add(root);
  const id = 30 + seed * 10;
  const suit = celMat('#eeece6', id), suit2 = celMat('#e1ded5', id + 1), dark = celMat('#5a606b', id + 2), joint = celMat('#c9c6bd', id + 3);
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);
  const part = (geo, mat, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  // proportions of a bulky suit, ~1.9 m to the top of the helmet; joints sit inside the shells so nothing floats
  const pelvis = new THREE.Group(); pelvis.position.y = 0.9; root.add(pelvis);
  const hips = part(cap(0.15, 0.2), suit2, pelvis, 0, 0.0, 0); hips.rotation.z = Math.PI / 2; hips.scale.set(1, 1, 0.95);
  part(new THREE.TorusGeometry(0.2, 0.035, 8, 24), dark, pelvis, 0, 0.1, 0).rotation.x = Math.PI / 2;      // waist ring
  const torso = new THREE.Group(); torso.position.y = 0.1; pelvis.add(torso);
  part(cap(0.21, 0.26), suit, torso, 0, 0.3, 0).scale.set(1.3, 1, 0.92);
  part(new THREE.BoxGeometry(0.26, 0.16, 0.06), dark, torso, 0, 0.34, -0.2);                             // chest unit
  part(new THREE.BoxGeometry(0.06, 0.06, 0.03), celMat('#7fd4ff', 126 + seed, { mode: 2 }), torso, 0.07, 0.36, -0.235);
  const pack = part(cap(0.17, 0.26), suit2, torso, 0, 0.34, 0.2); pack.scale.set(1.25, 1, 0.62);          // backpack, attached
  part(new THREE.TorusGeometry(0.15, 0.035, 8, 24), dark, torso, 0, 0.64, 0).rotation.x = Math.PI / 2;     // neck ring
  const head = new THREE.Group(); head.position.set(0, 0.66, 0); torso.add(head);
  part(new THREE.SphereGeometry(0.205, 24, 18), celMat('#f6f5f0', id + 4, { gloss: 1.2 }), head, 0, 0.13, 0);
  // the visor: a dark glossy cap on the front of the helmet
  part(new THREE.SphereGeometry(0.21, 24, 14, Math.PI * 1.15, Math.PI * 0.7, Math.PI * 0.28, Math.PI * 0.34), celMat('#1f2633', id + 5, { gloss: 2.6 }), head, 0, 0.13, 0);
  const limb = (parent, x, y, r, l, mat, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); part(cap(r, l), mat, g, 0, -l / 2, 0); return g; };
  const arms = [-1, 1].map((sd) => {
    part(new THREE.SphereGeometry(0.11, 14, 10), joint, torso, sd * 0.29, 0.5, 0);                         // shoulder bearing
    const a = limb(torso, sd * 0.3, 0.5, 0.085, 0.24, suit);
    const f = limb(a, 0, -0.29, 0.078, 0.2, suit2);
    part(new THREE.SphereGeometry(0.07, 12, 8), dark, f, 0, -0.29, 0).scale.set(0.9, 1.1, 0.9);           // glove
    return [a, f];
  });
  const legs = [-1, 1].map((sd) => {
    const th = limb(pelvis, sd * 0.12, -0.02, 0.11, 0.26, suit);
    const sh = limb(th, 0, -0.41, 0.1, 0.28, suit2);
    const boot = part(cap(0.09, 0.16), dark, sh, 0, -0.47, -0.05); boot.rotation.x = Math.PI / 2; boot.scale.set(1.15, 1, 0.8);
    return [th, sh];
  });
  return {
    root,
    // p: { pos:[x,z], yaw, phase (cycles), gait 0 standing .. 1 wading .. 2 running, look (head yaw),
    //      tilt (head pitch, + up), bend (torso forward), kneel 0..1, reach 0..1 (arms forward), lie 0..1, y }
    update(p) {
      const ph = (p.phase ?? 0) * Math.PI * 2, g = p.gait ?? 0;
      const wade = Math.min(1, g), run = Math.max(0, g - 1), kn = p.kneel ?? 0, lie = p.lie ?? 0;
      root.position.set(p.pos[0], (p.y ?? 0) - 0.2 - 0.03 * Math.abs(Math.sin(ph)) * wade - 0.36 * kn, p.pos[1]);
      root.rotation.set(-lie * Math.PI / 2, p.yaw, 0, 'YXZ');
      pelvis.position.y = 0.9 + 0.035 * Math.cos(ph * 2) * wade;
      torso.rotation.x = -0.08 * wade - 0.2 * run - (p.bend ?? 0);
      head.rotation.set(p.tilt ?? 0, p.look ?? 0, 0, 'YXZ');
      legs.forEach(([th, sh], i) => {
        const s = Math.sin(ph + i * Math.PI);
        // wading: lift the knee high to step out of the water
        // + thigh = foot forward; the shin only ever folds back
        th.rotation.x = (0.32 + 0.3 * run) * s * wade + 0.22 * Math.max(0, s) * wade + kn * (i ? 1.45 : -0.15);
        sh.rotation.x = -((0.12 + 0.75 * Math.max(0, s)) * wade + 0.5 * run * Math.max(0, -s) + kn * (i ? 1.45 : 1.75));
      });
      const reach = p.reach ?? 0;
      arms.forEach(([a, f], i) => {
        const s = Math.sin(ph + i * Math.PI + Math.PI);
        a.rotation.x = (0.25 + 0.5 * run) * s * wade + reach * 1.15; a.rotation.z = (i ? 1 : -1) * (0.14 + 0.08 * reach);
        f.rotation.x = 0.35 + 0.6 * run + reach * 0.2;
      });
    },
  };
}
