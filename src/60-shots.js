// ---- performance: where everyone is at film time t (pure functions of t)
const RANGER_AT = [12, 0, -48];           // nose to -X, tail ramp to +X, the wave comes from -Z
const RAMP_AT = [27, -48];
const WRECK_AT = [-40, -140];
const CASE_HOME = [22, -40];
// a stand-in for the wreck's transform, so the performance can find the hinged panel without the scene
const _wr = new THREE.Object3D(); _wr.position.set(WRECK_AT[0], -0.9, WRECK_AT[1]); _wr.rotation.set(0.2, deg(-25), deg(28), 'YXZ'); _wr.updateMatrixWorld(true);
const HINGE = _wr.localToWorld(new THREE.Vector3(-5.5, 0.4, 7.5)).toArray();
const PINNED = [HINGE[0] + Math.sin(deg(-25)) * 2.0, HINGE[2] + Math.cos(deg(-25)) * 2.0];   // where Brand kneels, under the panel
const yawTo = (a, b) => Math.atan2(-(b[0] - a[0]), -(b[1] - a[1]));
const along = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const dist2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

function cooperAt(t) {
  const a = [4, -24], b = [-1, -34], k = invLerp(0, 9, t);
  const look = track([[8.6, 0], [9.6, 0.5], [12.4, 0.55], [13.0, 0.2]], t), tilt = track([[8.6, 0], [9.6, 0.12], [12.4, 0.18]], t);
  return { pos: along(a, b, k), yaw: yawTo(a, b), phase: dist2(a, b) * k / 1.35, gait: 1 - smooth(invLerp(8.2, 9.0, t)), look, tilt };
}
function brandAt(t) {
  const a = [-10, -62], b = PINNED;
  if (t < 23) {
    const k = invLerp(0, 23, t) * 0.97 + 0.03 * smooth(invLerp(20, 23, t));
    const turn = smooth(invLerp(13.8, 14.4, t)) * (1 - smooth(invLerp(14.9, 15.5, t)));
    return { pos: along(a, b, k), yaw: yawTo(a, b) + turn * 2.4, phase: dist2(a, b) * k / 1.35, gait: 1.3 * (1 - turn * 0.9), look: turn * 0.5 };
  }
  if (t < CUES.caseGo + 3.3) {
    // kneeling at the wreck, pulling the recorder; the panel comes down on her leg
    const pin = smooth(invLerp(25.6, 26.0, t));
    return { pos: b, yaw: yawTo(b, [HINGE[0], HINGE[2]]), kneel: 0.85, reach: 1 - 0.5 * pin, bend: 0.45 - 0.2 * pin, tilt: -0.2 + 0.5 * pin };
  }
  return null;   // CASE carries her (see caseAt)
}
function caseAt(t) {
  const go = CUES.caseGo, there = go + 3.3, pick = there + 0.5, home = pick + 6.5;
  const grab = [PINNED[0] + 2.0, PINNED[1] + 1.0];
  const back = [RAMP_AT[0] - 3, RAMP_AT[1] + 2];
  if (t < go) return { pos: CASE_HOME, yaw: deg(90), wheel: 0, roll: 0 };
  if (t < there) { const k = easeIn(invLerp(go, there, t), 1.3); return { pos: along(CASE_HOME, grab, k), yaw: yawTo(CASE_HOME, grab), wheel: smooth(invLerp(go, go + 0.4, t)), roll: dist2(CASE_HOME, grab) * k }; }
  if (t < pick) return { pos: grab, yaw: yawTo(grab, back), wheel: 1, roll: dist2(CASE_HOME, grab), carry: smooth(invLerp(there, pick, t)) };
  const k = invLerp(pick, home, t);
  return { pos: along(grab, back, k), yaw: yawTo(grab, back), wheel: 1 - smooth(invLerp(home - 0.3, home + 0.3, t)), roll: dist2(CASE_HOME, grab) + dist2(grab, back) * k, carry: 1 };
}
function doyleAt(t) {
  const look = smooth(invLerp(35.5, 37, t));
  return { pos: RAMP_AT, yaw: yawTo(RAMP_AT, WRECK_AT) + look * 0.15, look: 0, tilt: look * 0.75, reach: smooth(invLerp(31, 32, t)) * (1 - look) * 0.6 };
}
// when the toe of the wave reaches the Ranger; the climb up the face takes CLIMB seconds
const CLIMB = 1.9;
const TOE_HITS = (() => { const x = RANGER_AT[0]; for (let t = 38; t < 48; t += 0.01) { const H = WAVE.H(t) * ridge(x); if (WAVE.z(t) + waveBend(x, WAVE.H(t)) + 0.55 * H >= RANGER_AT[2]) return t; } return 43; })();
function rangerAt(t) {
  const tt = onTwos(t), x = RANGER_AT[0];
  const H = WAVE.H(tt) * ridge(x), zb = WAVE.z(tt) + waveBend(x, WAVE.H(tt));
  const climb = invLerp(TOE_HITS, TOE_HITS + CLIMB, tt);
  let y, z, roll;
  if (tt < TOE_HITS) { y = 0; z = RANGER_AT[2]; roll = 0; }
  else if (climb < 1) {
    // carried up the face: it stays in front of the water, tilted back against the slope
    const f = 0.95 * smooth(climb);
    y = f * H; z = zb + waveFrontAbove(WAVE.lean(tt), f) * H + 8;
    roll = -lerp(0.15, 1.0, smooth(invLerp(0, 0.35, climb))) * (1 - smooth(invLerp(0.8, 1, climb)) * 0.8);
  } else {
    // over the top and riding down the back while the wave runs on under it
    const tc = TOE_HITS + CLIMB, zc = WAVE.z(tc) + waveBend(x, WAVE.H(tc)) + waveFrontAbove(WAVE.lean(tc), 0.95) * WAVE.H(tc) * ridge(x) + 8;
    z = zc + 20 * smooth(invLerp(tc, tc + 3, tt));
    const s = waveSurface(WAVE, tt, x, z);
    y = Math.max(s.y, 0.95 * H * (1 - smooth(invLerp(tc, tc + 0.25, tt)))) + 0.4;
    roll = clamp(Math.atan(-s.slope) * 0.9, -1.0, 1.0);
  }
  const ride = smooth(invLerp(TOE_HITS - 0.2, TOE_HITS, tt));
  return {
    pos: [x, y, z], yaw: deg(90), pitch: 0.06 * Math.sin(tt * 2.3) * ride, roll,
    engine: 0.25 * smooth(invLerp(36, 37, tt)) + 0.6 * smooth(invLerp(CUES.after + 1.5, CUES.after + 3, tt)), gear: 1,
    ramp: 1 - smooth(invLerp(38.6, 40.0, tt)), interior: false,
  };
}
