// ---- cameras, one per shot, following the cutting of the original scene
const add3 = (p, x, y, z) => [p[0] + x, (p.length === 3 ? p[1] : 0) + y, (p.length === 3 ? p[2] : p[1]) + z];
const head = (p, h = 1.72) => [p.pos[0], h, p.pos[1]];
const rw = (lx, ly, lz) => [RANGER_AT[0] + lz, 1.5 + ly, RANGER_AT[2] - lx];        // Ranger body local -> world, at rest
const shake = (t, a, f = 9) => [noise1(t * f, 11) * a, noise1(t * f, 12) * a * 0.6, noise1(t * f, 13) * a * 0.3];
const withShake = (c, s) => ({ ...c, pos: [c.pos[0] + s[0], c.pos[1] + s[1], c.pos[2] + s[2]] });
const crestAt = (t, x) => [x, WAVE.H(t) * ridge(x) * 0.9, WAVE.z(t) + waveBend(x, WAVE.H(t))];

const CAMS = {
  // Brand wades away; Cooper's helmet big in the foreground
  s01: (lt, d, t) => { const c = cooperAt(t), b = brandAt(t); return { pos: add3(head(c), 0.75, 0.12, 1.25), look: add3(head(b, 1.2), 0, 0, 0), fov: 38 }; },
  // boots in the water
  s02: (lt, d, t) => { const c = cooperAt(t); return { pos: add3([c.pos[0], 0.3, c.pos[1]], 1.6, 0, -2.6), look: [c.pos[0], 0.35, c.pos[1] + 0.2], fov: 38 }; },
  // Cooper looks across at the wreck
  s03: (lt, d, t) => { const c = cooperAt(t); return { pos: add3(head(c), -1.6, -0.15, -2.6), look: head(c, 1.55), fov: 34 }; },
  // Brand, small, walking toward the mountains
  s04: (lt, d, t) => { const b = brandAt(t); return { pos: add3(head(b), 4.5, 1.2, 14 - lt * 1.2), look: [b.pos[0] - 25, 22, b.pos[1] - 600], fov: 40 }; },
  // Cooper turns his head to the horizon: profile against the sky
  s05: (lt, d, t) => { const c = cooperAt(t); return { pos: add3(head(c), 1.0, 0.0, 0.9), look: add3(head(c), -2.2, 0.15, -2.6), fov: 34 }; },
  // what he sees: the mountains, telephoto, slow push
  s06: (lt, d, t) => { const c = cooperAt(t), k = smooth(lt / d); return { pos: head(c, 1.75), look: [-700, lerp(80, 110, k), WAVE.z(t)], fov: lerp(16, 12, k) }; },
  // close on his visor
  s07: (lt, d, t) => { const c = cooperAt(t); return { pos: add3(head(c), -0.55, 0.0, -0.85), look: head(c, 1.75), fov: 30 }; },
  // Brand turns back
  s08: (lt, d, t) => { const b = brandAt(t); return { pos: add3(head(b), -2.4, -0.1, -3.6), look: head(b, 1.4), fov: 32 }; },
  // the wave on the horizon, the wreck and Brand tiny in front of it
  s09: (lt, d, t) => ({ pos: [2, 2.0 + lt * 0.1, -20], look: [-60, 70, -1500], fov: 34 - lt }),
  // Cooper in the cockpit, looking out of the side window
  s10: (lt, d, t) => ({ pos: rw(-0.4, 4.15, -4.5), look: rw(6, 4.3, -6.4), fov: 58 }),
  // wide: the wave coming over the plain
  s11: (lt, d, t) => withShake({ pos: [70, 10, 40 - lt * 2], look: [-30, 55, -700], fov: 50 }, shake(t, 0.05)),
  // Brand at the wreck
  s12: (lt, d, t) => { const b = brandAt(t); return { pos: add3([b.pos[0], 1.4, b.pos[1]], 4.5, 0.2, 5.5), look: [b.pos[0] - 0.5, 0.9, b.pos[1] - 1], fov: 40 }; },
  // she pulls the recorder; the panel comes down
  s13: (lt, d, t) => { const b = brandAt(t); return { pos: add3([b.pos[0], 0.9, b.pos[1]], 2.0, 0.3, 2.4), look: [b.pos[0] - 0.3, 0.6, b.pos[1] - 0.6], fov: 46 }; },
  // CASE rolls out across the water: low tracking shot
  s14: (lt, d, t) => { const c = caseAt(t), dir = [Math.sin(c.yaw), Math.cos(c.yaw)]; return withShake({ pos: [c.pos[0] + dir[1] * 6 - dir[0] * 2, 1.0, c.pos[1] - dir[0] * 6 - dir[1] * 2], look: [c.pos[0] - dir[0] * 1.5, 1.0, c.pos[1] - dir[1] * 1.5], fov: 44 }, shake(t, 0.12, 14)); },
  // CASE brings her back, the wall behind them
  s15: (lt, d, t) => { const c = caseAt(t); const side = [Math.cos(c.yaw), -Math.sin(c.yaw)], fwd = [-Math.sin(c.yaw), -Math.cos(c.yaw)]; return withShake({ pos: [c.pos[0] + side[0] * 9 + fwd[0] * 3, 2.3, c.pos[1] + side[1] * 9 + fwd[1] * 3], look: [c.pos[0] + side[0] * 0.8, 0.6 + lt * 0.8, c.pos[1] + side[1] * 0.8], fov: 46 }, shake(t, 0.1)); },
  // the Ranger, tiny, under the wall
  s16: (lt, d, t) => ({ pos: [420, 24, 240], look: [-20, 110 + lt * 6, -260], fov: 40 }),
  // Doyle looks up
  s17: (lt, d, t) => withShake({ pos: [RAMP_AT[0] + 5, 0.9, RAMP_AT[1] + 7], look: [RAMP_AT[0] - 8, 28 + lt * 4, RAMP_AT[1] - 120], fov: 48 }, shake(t, 0.12)),
  // wide again, much closer
  s18: (lt, d, t) => withShake({ pos: [-38, 2.8, 26], look: [6, 60 + lt * 8, -150], fov: 54 }, shake(t, 0.25)),
  // the face, from the ramp; the toe takes Doyle
  s19: (lt, d, t) => withShake({ pos: [RAMP_AT[0] + 22, 1.6, RAMP_AT[1] + 34], look: [RAMP_AT[0] - 6, lerp(28, 40, smooth(lt / d)), RAMP_AT[1] - 40], fov: lerp(60, 72, smooth(lt / d)) }, shake(t, 0.4, 12)),
  // the Ranger carried up the face: from far off, it is a speck on a moving mountain
  s20: (lt, d, t) => { const r = rangerAt(t); return withShake({ pos: [-110, 18, 420], look: [r.pos[0] - 4, r.pos[1] + 4, r.pos[2]], fov: lerp(22, 30, lt / d) }, shake(t, 0.2)); },
  // over the crest: from behind the wave, the Ranger tipping over the top
  s21: (lt, d, t) => { const r = rangerAt(t); return withShake({ pos: [r.pos[0] - 70, r.pos[1] + 45, r.pos[2] - 90], look: [r.pos[0] + 2, r.pos[1] - 4, r.pos[2] + 40], fov: 40 }, shake(t, 0.3)); },
  // riding down the back of it; the crest runs away from us
  s22: (lt, d, t) => { const r = rangerAt(t); const cz = r.pos[2] - 80; const sy = waveSurface(WAVE, t, r.pos[0] - 40, cz).y;
    return { pos: [r.pos[0] - 40, Math.max(r.pos[1] + 14, sy + 6), cz], look: [r.pos[0], r.pos[1] - 4, r.pos[2] + 120], fov: 46 }; },
  // the hull streaming; on the horizon the next one is already standing up
  s23: (lt, d, t) => { const r = rangerAt(t); return { pos: [r.pos[0] + 26, r.pos[1] + 5, r.pos[2] + 28], look: [r.pos[0] - 120, r.pos[1] + 40 - lt * 2, r.pos[2] - 1500], fov: 38 }; },
  title: () => ({ pos: [0, 2, 0], look: [0, 2, -10], fov: 40 }),
};

function stateFor(frame) {
  const t = frame / FPS, sh = shotAt(t);
  const lt = t - sh.start, d = sh.end - sh.start;
  const st = { frame, t, shot: sh.id, lt, d };
  st.cam = CAMS[sh.id](lt, d, t);
  st.cooper = t < 15.2 ? cooperAt(t) : null;
  st.brand = t < 38.4 ? brandAt(t) : null;
  st.doyle = t < CUES.doyle ? doyleAt(t) : null;
  st.case = t < 38.4 ? caseAt(t) : null;
  st.ranger = rangerAt(t);
  st.ranger.interior = sh.id === 's10';
  st.wreck = { at: WRECK_AT, hinge: HINGE, drop: invLerp(25.6, 26.0, t), recorder: t > 24.6 && t < 31 ? [PINNED[0] - 0.4, 0.75, PINNED[1] - 0.55] : null };
  st.fadeColor = t < 5 ? '#05070a' : '#f7f6f1';
  st.fade = t < 0.4 ? 1 - smooth(t / 0.4) : smooth(invLerp(CUES.title - 0.5, CUES.title, t));
  st.flash = 0;
  st.title = invLerp(CUES.title + 0.1, CUES.end - 0.4, t);
  return st;
}
