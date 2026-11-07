// ---- soundtrack: synthesized offline (48 kHz stereo, DURATION s), keyed to CUES.
// An original pipe-organ chord progression, a ticking clock, shallow water, the wave, CASE, the Ranger.
async function renderSoundtrack() {
  const SR = 48000, ac = new OfflineAudioContext(2, SR * DURATION, SR);
  const rng = new Rng(11);
  const NOISE = ac.createBuffer(2, SR * DURATION, SR), BROWN = ac.createBuffer(2, SR * DURATION, SR);
  for (let c = 0; c < 2; c++) {
    const d = NOISE.getChannelData(c), b = BROWN.getChannelData(c); let y = 0;
    for (let i = 0; i < d.length; i++) { d[i] = rng.next() * 2 - 1; y = (y + d[i] * 0.02) * 0.998; b[i] = y * 3.5; }
  }
  const ir = ac.createBuffer(2, SR * 4, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let y = 0; for (let i = 0; i < d.length; i++) { y += ((rng.next() * 2 - 1) - y) * 0.3; d[i] = y * Math.exp(-i / (SR * 0.9)); } }
  const master = ac.createGain(); master.gain.value = 0.85;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.3;
  master.connect(comp); comp.connect(ac.destination);
  const verb = ac.createConvolver(); verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = 0.5; verb.connect(vg); vg.connect(master);
  master.gain.setValueAtTime(0.85, DURATION - 0.4); master.gain.linearRampToValueAtTime(0, DURATION);
  const gain = (v, wet = 0) => { const g = ac.createGain(); g.gain.value = v; g.connect(master); if (wet) { const s = ac.createGain(); s.gain.value = wet; g.connect(s); s.connect(verb); } return g; };
  const filt = (type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const src = (buf, t0, t1, out) => { const s = ac.createBufferSource(); s.buffer = buf; s.connect(out); s.start(t0, t0); s.stop(t1); return s; };
  const osc = (type, f, t0, t1, out) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.connect(out); o.start(t0); o.stop(t1); return o; };
  const env = (g, pts) => { g.gain.setValueAtTime(pts[0][1], pts[0][0]); for (const [t, v] of pts.slice(1)) g.gain.linearRampToValueAtTime(v, t); };
  const C = CUES, T = C.title;
  const burst = (t0, len, f, q, a, wet = 0.2) => { const g = gain(0, wet), b = filt('bandpass', f, q); b.connect(g); src(NOISE, t0, t0 + len, b); env(g, [[t0, 0], [t0 + 0.01, a], [t0 + len, 0]]); };

  // shallow water and wind, rising as the wave comes
  { const g = gain(0, 0.15), f = filt('lowpass', 900); f.connect(g); src(NOISE, 0, T, f); env(g, [[0, 0], [0.5, 0.07], [30, 0.06], [T, 0.03]]); }
  { const g = gain(0), f = filt('bandpass', 500, 0.6); f.connect(g); src(NOISE, 0, T, f); env(g, [[0, 0], [2, 0.03], [36, 0.08], [44, 0.1], [T, 0]]); }
  // wading splashes, on the steps
  for (let t0 = 0.3; t0 < 8.5; t0 += 0.68) burst(t0, 0.32, 1400 + 300 * rng.next(), 1.2, 0.1);
  for (let t0 = 13.6; t0 < 23; t0 += 0.55) burst(t0, 0.28, 1700 + 300 * rng.next(), 1.2, t0 > 15.2 && t0 < 17 ? 0.0 : 0.05);
  // the clock: a tick every 1.25 s (on Miller's planet each one is a day on Earth)
  const tick = (t0, a) => {
    const g = gain(0, 0.35), f = filt('highpass', 2500); f.connect(g); src(NOISE, t0, t0 + 0.05, f); env(g, [[t0, 0], [t0 + 0.002, a], [t0 + 0.04, 0]]);
    const g2 = gain(0, 0.4); osc('sine', 1900, t0, t0 + 0.12, g2); env(g2, [[t0, 0], [t0 + 0.002, a * 0.3], [t0 + 0.1, 0]]);
  };
  for (let t0 = 0.4; t0 < T - 0.5; t0 += C.tick) tick(t0, t0 > 36 ? 0.5 : 0.32);
  tick(T + 1.6, 0.4);
  // organ: additive pipes, an original progression in A minor that keeps climbing
  const pipe = (f, t0, t1, a, out) => { for (const [m, w] of [[1, 1], [2, 0.5], [3, 0.22], [4, 0.25], [6, 0.08], [8, 0.07]]) { const g = ac.createGain(); g.gain.value = w * a; g.connect(out); osc('sine', f * m, t0, t1, g); } };
  const organ = gain(0, 0.9), of = filt('lowpass', 700, 0.5); of.connect(organ);
  of.frequency.setValueAtTime(700, 4); of.frequency.linearRampToValueAtTime(1600, 20); of.frequency.linearRampToValueAtTime(4500, 44.6); of.frequency.linearRampToValueAtTime(1200, T);
  const A1 = 55;
  const CH = [
    [4, 10, [0, 12, 19]], [10, 12.4, [-4, 8, 15]], [12.4, 15.2, [-4, 8, 15, 20]], [15.2, 20, [3, 10, 15, 22]],
    [20, 27.2, [0, 12, 19, 24]], [27.2, 30.5, [-2, 10, 17, 22]], [30.5, 33, [-4, 8, 15, 20, 24]], [33, 38, [-5, 7, 14, 19, 23]],
    [38, 42.8, [0, 12, 19, 24, 31]], [42.8, 44.6, [-4, 8, 15, 20, 27, 32]], [44.6, 46, [3, 15, 22, 27, 34]], [46, T + 0.3, [-5, 7, 14, 19, 26]],
  ];
  for (const [t0, t1, notes] of CH) for (const n of notes) pipe(A1 * Math.pow(2, n / 12), t0, t1 + 0.15, 0.045, of);
  env(organ, [[4, 0], [8, 0.18], [12.4, 0.3], [20, 0.4], [30, 0.5], [38, 0.65], [42.8, 0.9], [44.6, 1.0], [46, 0.6], [49, 0.35], [T, 0.0]]);
  // the wave: a rumble that grows to a roar, a sub you feel
  { const g = gain(0, 0.25), f = filt('lowpass', 140); f.connect(g); src(BROWN, 10, 49, f);
    f.frequency.setValueAtTime(140, 12); f.frequency.exponentialRampToValueAtTime(1000, 44.6); f.frequency.exponentialRampToValueAtTime(300, 49);
    env(g, [[10, 0], [15, 0.2], [30, 0.4], [40, 0.75], [44.6, 1.0], [47, 0.5], [49, 0]]); }
  { const g = gain(0), o = osc('sine', 32, 12, 48, g); o.frequency.linearRampToValueAtTime(44, 44.6); env(g, [[12, 0], [20, 0.2], [40, 0.45], [44.6, 0.6], [48, 0]]); }
  { const g = gain(0, 0.2), f = filt('highpass', 2000); f.connect(g); src(NOISE, 30, 48, f); env(g, [[30, 0], [40, 0.07], [44.6, 0.2], [48, 0]]); }
  // the panel comes down on Brand's leg: a dull metal hit
  { const t0 = 25.85; burst(t0, 0.4, 600, 2.5, 0.6, 0.4); const g = gain(0, 0.5); osc('triangle', 180, t0, t0 + 0.6, g); env(g, [[t0, 0], [t0 + 0.005, 0.25], [t0 + 0.55, 0]]); }
  // CASE rolling: a slab hits the water every eighth of a turn
  { const step = (2 * Math.PI * 1.05) / 8; let last = -1;
    for (let t0 = C.caseGo; t0 < 38; t0 += 1 / 48) { const c = caseAt(t0); if (c.wheel < 0.6) continue; const n = Math.floor(c.roll / step); if (n !== last) { last = n; burst(t0, 0.09, 900 + 500 * rng.next(), 1.5, 0.18, 0.1); } } }
  // the toe takes Doyle; then the roar of the face
  burst(C.doyle, 1.2, 400, 0.5, 0.9, 0.5);
  // the Ranger: thrusters idle on the ramp, then flat out once it is clear
  { const g = gain(0, 0.2), f = filt('bandpass', 600, 0.8); f.connect(g); src(NOISE, 36, T, f);
    f.frequency.setValueAtTime(500, 36); f.frequency.exponentialRampToValueAtTime(2200, T);
    env(g, [[36, 0], [37, 0.12], [47, 0.12], [48.5, 0.4], [T, 0.3]]); }
  { const g = gain(0, 0.2), o = osc('sawtooth', 160, 36, T, g); o.frequency.setValueAtTime(160, 47); o.frequency.exponentialRampToValueAtTime(700, T);
    env(g, [[36, 0], [37, 0.012], [47, 0.012], [48.5, 0.03], [T, 0.02]]); }
  // the title: a single low organ note left ringing
  { const g = gain(0, 1.2); pipe(A1 * 2, T, DURATION, 0.05, g); env(g, [[T, 0], [T + 0.4, 0.35], [DURATION, 0.1]]); }
  return ac.startRendering();
}
