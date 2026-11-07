// ---- util: deterministic helpers (every frame is a pure function of t)
THREE.ColorManagement.enabled = false;   // hex colours are display colours; the grade does the rest
const FPS = 24, DURATION = 54, FRAMES = FPS * DURATION;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeIn = (t, p = 2) => Math.pow(clamp(t), p);
const easeOut = (t, p = 2) => 1 - Math.pow(1 - clamp(t), p);
const deg = (d) => (d * Math.PI) / 180;
const onTwos = (t) => Math.floor(t * 12 + 1e-6) / 12;
const onThrees = (t) => Math.floor(t * 8 + 1e-6) / 8;
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
class Rng {
  constructor(s) { this.r = mulberry32(s); }
  next() { return this.r(); }
  range(a, b) { return a + (b - a) * this.r(); }
}
// keyframes: [[time, value(number|array), ease?], ...]
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, ease] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const u = (ease || smooth)((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}
const lin = (x) => x;
function noise1(x, seed = 0) {
  const h = (n) => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
}

// story beats (film seconds); picture and sound both key off these. Shots follow the original scene's cutting.
const CUES = {
  tick: 1.25,          // the clock: one tick = one day back on Earth
  notMountains: 10.0,  // "those aren't mountains"
  waves: 12.4,         // "they're waves"
  caseGo: 27.2,
  alarm: 38.0,
  doyle: 43.4,         // the toe takes Doyle
  lift: 43.6,          // the wave picks the Ranger up
  crest: 45.5,
  after: 46.6,
  title: 51.0,
  end: 54.0,
};
const SHOTS = [
  { id: 's01', start: 0, end: 3.0 },      // Brand wades away, Cooper's helmet in the foreground
  { id: 's02', start: 3.0, end: 4.2 },    // boots splashing
  { id: 's03', start: 4.2, end: 6.0 },    // Cooper: wreckage
  { id: 's04', start: 6.0, end: 8.4 },    // Brand walks toward the mountains
  { id: 's05', start: 8.4, end: 10.0 },   // Cooper looks at the horizon
  { id: 's06', start: 10.0, end: 12.4 },  // his view: the mountains
  { id: 's07', start: 12.4, end: 13.6 },  // Cooper: they are waves
  { id: 's08', start: 13.6, end: 15.2 },  // Brand turns
  { id: 's09', start: 15.2, end: 18.2 },  // the wave on the horizon
  { id: 's10', start: 18.2, end: 20.0 },  // Cooper in the cockpit
  { id: 's11', start: 20.0, end: 23.0 },  // wide: the wave coming
  { id: 's12', start: 23.0, end: 25.0 },  // Brand at the wreck
  { id: 's13', start: 25.0, end: 27.2 },  // she pulls the recorder, gets pinned
  { id: 's14', start: 27.2, end: 30.5 },  // CASE rolls out across the water
  { id: 's15', start: 30.5, end: 33.0 },  // CASE carries her back
  { id: 's16', start: 33.0, end: 36.0 },  // the Ranger, tiny, under the wall
  { id: 's17', start: 36.0, end: 38.0 },  // Doyle looks up
  { id: 's18', start: 38.0, end: 40.0 },  // wide again, closer
  { id: 's19', start: 40.0, end: 43.6 },  // the face, close; Doyle is taken
  { id: 's20', start: 43.6, end: 45.5 },  // the Ranger is carried up the face
  { id: 's21', start: 45.5, end: 46.6 },  // over the crest
  { id: 's22', start: 46.6, end: 49.2 },  // after: riding down the back
  { id: 's23', start: 49.2, end: 51.0 },  // the hull streaming; the next wave on the horizon
  { id: 'title', start: 51.0, end: 54.0 },
];
const shotAt = (t) => SHOTS.find((s) => t < s.end) || SHOTS[SHOTS.length - 1];

function shaderMat(vs, fs, uniforms, opts = {}) {
  return new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: GLSL[vs], fragmentShader: GLSL[fs], uniforms, side: THREE.DoubleSide, ...opts });
}
