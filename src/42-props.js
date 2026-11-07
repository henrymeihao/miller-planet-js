// ---- props: Miller's wreck with its beacon, CASE (four slabs that stand or roll as a wheel)
function buildWreck(scene) {
  const root = new THREE.Group(); scene.add(root);
  const hullPts = [[0, 12], [3.2, 8], [6.4, -2], [6.0, -10], [-6.0, -10], [-6.4, -2], [-3.2, 8], [0, 12]];
  const hull = new THREE.Mesh(extrudeY(hullPts, 1.9, 0.35), celMat('#6f6d68', 50)); root.add(hull);
  const top = new THREE.Mesh(extrudeY(hullPts.map(([x, f]) => [x * 0.82, f * 0.86 - 0.8]), 1.3, 0.25), celMat('#9a968c', 51)); top.position.y = 2.1; root.add(top);
  const band = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.35, 3.0), celMat('#3e4248', 52)); band.position.set(0, 2.0, 3.5); root.add(band);
  hull.rotation.z = top.rotation.z = band.rotation.z = 0;
  root.rotation.set(0.2, deg(-25), deg(28), 'YXZ');
  // the loose panel that pins Brand: hinged at its far edge
  const hinge = new THREE.Group(); hinge.position.set(-2.4, 0.6, 9.5); scene.add(hinge);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.28, 2.2), celMat('#7c7a73', 53)); panel.position.set(0, 0, 1.1); hinge.add(panel);
  const strut = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 2.6), celMat('#3e4248', 54)); strut.position.set(1.2, -0.2, 1.0); hinge.add(strut);
  const beaconMat = celMat('#300808', 122, { mode: 2 });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 12), beaconMat); beacon.position.set(1.2, 3.6, -2); root.add(beacon);
  const recorder = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.3), celMat('#d8a23a', 55)); scene.add(recorder);
  const _w = new THREE.Vector3();
  return {
    root, hinge,
    // p: { at:[x,z], hinge:[x,y,z], drop 0..1 (panel falls onto her leg), recorder:[x,y,z] | null }
    update(p, st) {
      root.position.set(p.at[0], -0.9, p.at[1]);
      hinge.position.set(...p.hinge);
      hinge.rotation.set(lerp(-1.25, -0.08, easeIn(p.drop, 2)), deg(-25), 0, 'YXZ');
      const blink = Math.floor(st.t * 1.6) % 2 === 0 ? 1 : 0;
      beaconMat.uniforms.uColor.value.setRGB(0.25 + 3.0 * blink, 0.05 + 0.4 * blink, 0.05 + 0.3 * blink);
      recorder.visible = !!p.recorder;
      if (p.recorder) recorder.position.set(...p.recorder);
    },
  };
}

function buildCase(scene) {
  const root = new THREE.Group(); scene.add(root);
  const hub = new THREE.Group(); hub.position.y = 1.05; root.add(hub);
  const slabs = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(); g.position.x = (i - 1.5) * 0.45; hub.add(g);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.1, 0.5), celMat(i % 2 ? '#5a5e66' : '#676b73', 60 + i, { gloss: 1.2 })); g.add(m);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.02), celMat('#ffffff', 123, { mode: 2 })); lamp.position.set(0, 0.55, -0.26); g.add(lamp);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.05, 0.51), celMat('#2e3036', 64 + i)); strip.position.y = -0.3; g.add(strip);
    slabs.push(g);
  }
  return {
    root,
    // p: { pos:[x,z], yaw, wheel 0..1, roll (distance rolled, m) }
    update(p) {
      root.position.set(p.pos[0], -0.25 * p.wheel, p.pos[1]);
      root.rotation.y = p.yaw;
      const spin = -p.roll / 1.05;
      slabs.forEach((g, i) => { g.rotation.x = p.wheel * ((i * Math.PI) / 4 + spin); });
    },
  };
}
