// ---- the Ranger: a flat wedge lander, nose along local -Z, standing on four legs
const celMat = (color, id, extra = {}) => shaderMat('cel_vs', 'cel_fs', { ...U, uColor: { value: new THREE.Color(color) }, uId: { value: id }, uGloss: { value: extra.gloss ?? 0.5 }, uMode: { value: extra.mode ?? 0 } });
function extrudeY(points, depth, bevel) {
  const s = new THREE.Shape(); points.forEach(([x, f], i) => (i ? s.lineTo(x, f) : s.moveTo(x, f)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 });
  g.rotateX(-Math.PI / 2);   // shape y -> -z (forward), extrusion -> +y
  return g;
}
function buildRanger(scene) {
  const root = new THREE.Group(); scene.add(root);
  const body = new THREE.Group(); root.add(body); body.position.y = 1.5;
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const hull = [[0, 12], [3.2, 8], [6.4, -2], [6.0, -10], [-6.0, -10], [-6.4, -2], [-3.2, 8], [0, 12]];
  add(extrudeY(hull, 1.9, 0.35), celMat('#8f8c84', 40), 0, 0, 0);
  add(extrudeY(hull.map(([x, f]) => [x * 0.82, f * 0.86 - 0.8]), 1.3, 0.25), celMat('#c4c0b4', 41), 0, 2.1, 0);
  // dark band and spine
  add(new THREE.BoxGeometry(13.2, 0.35, 3.0), celMat('#4a4f58', 42), 0, 2.0, 3.5);
  add(extrudeY([[0, 9], [1.4, 5], [1.4, -7], [-1.4, -7], [-1.4, 5], [0, 9]], 0.9, 0.15), celMat('#e8e5dc', 43), 0, 3.4, 0);
  // cockpit windows
  const win = celMat('#1b2230', 44, { gloss: 2.2 });
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.6, 0.5, 1.2), win, s * 1.0, 3.7, -7.4).rotation.x = -0.35;
  add(new THREE.BoxGeometry(3.2, 0.45, 0.9), win, 0, 3.3, -8.6).rotation.x = -0.5;
  // engine pods at the tail
  const nozzles = [];
  const nozMat = celMat('#2a2d33', 120, { mode: 2 });
  for (const s of [-1, 1]) {
    const pod = add(new THREE.CylinderGeometry(1.1, 1.25, 5.5, 14), celMat('#b7b3a8', 45), s * 4.2, 1.6, 8.6);
    pod.rotation.x = Math.PI / 2;
    nozzles.push(add(new THREE.CircleGeometry(0.95, 16), nozMat, s * 4.2, 1.6, 11.4));
  }
  // VTOL thrusters under the belly, and their plumes
  const plumeMat = celMat('#bfe4ff', 121, { mode: 2 });
  const plumes = [];
  for (const [x, z] of [[-3.8, -4], [3.8, -4], [-4.2, 6], [4.2, 6]]) {
    add(new THREE.CylinderGeometry(0.7, 0.8, 0.5, 12), nozMat, x, -0.25, z);
    const p = add(new THREE.ConeGeometry(0.75, 1, 12, 1, true), plumeMat, x, -0.5, z); p.rotation.x = Math.PI; p.geometry.translate(0, 0.5, 0);
    plumes.push(p);
  }
  // landing legs
  const legs = [];
  for (const [x, z] of [[-4.6, -5], [4.6, -5], [-4.6, 5.5], [4.6, 5.5]]) {
    const l = add(new THREE.BoxGeometry(0.35, 1.6, 0.35), celMat('#5d626b', 46), x, -1.1, z);
    add(new THREE.BoxGeometry(1.2, 0.2, 1.2), celMat('#5d626b', 47), 0, -0.8, 0, l);
    legs.push(l);
  }
  // the tail ramp, hinged at the bottom of the tail
  const rampHinge = new THREE.Group(); rampHinge.position.set(0, 0.2, 10.4); body.add(rampHinge);
  const ramp = add(new THREE.BoxGeometry(4.2, 0.25, 4.6), celMat('#9e9a90', 48), 0, 0, 2.3, rampHinge);
  add(new THREE.BoxGeometry(4.0, 3.0, 0.2), celMat('#20242c', 49), 0, 1.6, 10.2);   // the open door behind it
  // the cockpit seen from inside (only for the interior shot): side window looks out to +X, toward the wave
  const inside = new THREE.Group(); inside.visible = false; body.add(inside);
  const wall = celMat('#3b3f47', 70), wall2 = celMat('#4a4e57', 71), dash = celMat('#2a2d33', 72);
  const box = (w, h, d, m, x, y, z) => add(new THREE.BoxGeometry(w, h, d), m, x, y, z, inside);
  box(0.2, 1.1, 6.0, wall, 2.3, 2.85, -5.0);   // under the side window
  box(0.2, 0.6, 6.0, wall, 2.3, 5.0, -5.0);    // above it
  box(0.2, 1.4, 0.35, wall2, 2.3, 4.05, -6.2); // window posts
  box(0.2, 1.4, 0.35, wall2, 2.3, 4.05, -3.6);
  box(0.2, 2.8, 2.0, wall, 2.3, 3.7, -1.6);
  box(0.2, 2.8, 1.0, wall, 2.3, 3.7, -7.9);
  box(4.8, 0.2, 7.0, wall2, 0, 5.3, -5.0);     // roof
  box(4.8, 0.8, 1.2, dash, 0, 3.2, -7.6);      // dashboard
  box(4.8, 0.2, 7.0, wall, 0, 2.3, -5.0);      // floor
  const screen = celMat('#7fd4ff', 124, { mode: 2 }), amber = celMat('#ffb347', 125, { mode: 2 });
  box(0.7, 0.4, 0.05, screen, -1.0, 3.75, -7.0).rotation.x = -0.5;
  box(0.7, 0.4, 0.05, screen, 0.2, 3.75, -7.0).rotation.x = -0.5;
  box(0.3, 0.2, 0.05, amber, 1.3, 3.7, -7.0).rotation.x = -0.5;
  for (let i = 0; i < 6; i++) box(0.12, 0.06, 0.05, i % 2 ? amber : screen, -1.9 + (i % 3) * 0.22, 3.62 - Math.floor(i / 3) * 0.1, -7.0);
  // the pilot: helmet and shoulders, looking out of the side window
  const pilot = new THREE.Group(); pilot.position.set(0.9, 3.55, -5.4); inside.add(pilot);
  add(new THREE.CapsuleGeometry(0.22, 0.4, 4, 10), celMat('#eceae4', 73), 0, -0.2, 0, pilot).rotation.z = Math.PI / 2;
  add(new THREE.SphereGeometry(0.19, 20, 14), celMat('#f4f3ee', 74, { gloss: 1.2 }), 0, 0.3, 0, pilot);
  add(new THREE.BoxGeometry(0.5, 0.06, 0.4), celMat('#565c66', 75), 0, 0.02, 0, pilot);
  const outside = body.children.filter((c) => c !== inside);
  const hot = new THREE.Color();
  return {
    root, body,
    // p: { pos:[x,y,z], yaw, pitch, roll, engine 0..1, gear 0..1 (1 = down), ramp 0..1 (1 = down), interior }
    update(p, st) {
      inside.visible = !!p.interior; for (const c of outside) c.visible = !p.interior;
      root.position.set(...p.pos);
      root.rotation.set(p.pitch, p.yaw, p.roll, 'YXZ');
      const e = p.engine, fl = 0.85 + 0.15 * Math.abs(noise1(onThrees(st.t) * 9, 7));
      hot.setRGB(0.16 + 2.4 * e, 0.17 + 2.9 * e, 0.2 + 3.4 * e); nozMat.uniforms.uColor.value.copy(hot);
      for (const pl of plumes) { pl.visible = e > 0.02; pl.scale.set(1, (2 + 7 * e) * fl, 1); }
      rampHinge.rotation.x = lerp(-1.45, 0.4, p.ramp ?? 0);
      for (const l of legs) l.scale.y = Math.max(0.05, p.gear), l.position.y = -0.7 * p.gear + 0.2 * (1 - p.gear);
    },
  };
}
