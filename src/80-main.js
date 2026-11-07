// ---- main: build the film, render frame n, title card, player
const P = new URLSearchParams(location.search);
const LOW = P.get('q') === 'low';
const W = LOW ? 1280 : 1920, H = LOW ? 720 : 1080;
const canvas = document.getElementById('c'), tcan = document.getElementById('title');
canvas.width = tcan.width = W; canvas.height = tcan.height = H;
const post = new Post(canvas, W, H);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.3, 9000);
const world = buildWorld(scene);
const ranger = buildRanger(scene);
const astros = [buildAstronaut(scene, 0), buildAstronaut(scene, 1), buildAstronaut(scene, 2)];
const wreck = buildWreck(scene);
const caseBot = buildCase(scene);
const spray = buildSpray(scene);
const _v = new THREE.Vector3();

// title card on paper: brush-revealed title, a red seal, the tribute line
const tctx = tcan.getContext('2d');
const SERIF = '"Hiragino Mincho ProN", "Songti SC", "Noto Serif CJK SC", "Yu Mincho", serif';
const SPECK = (() => { const r = new Rng(21), a = []; for (let i = 0; i < 320; i++) a.push([r.range(-0.5, 0.5), r.range(-0.5, 0.5), r.range(0.002, 0.008), r.next()]); return a; })();
function drawTitle(st) {
  tctx.clearRect(0, 0, W, H);
  const k = st.title;
  if (k <= 0) return;
  const cx = W * 0.5, cy = H * 0.43, S = H * 0.2;
  tctx.save();
  const rev = easeOut(invLerp(0, 0.45, k), 2);
  tctx.beginPath();
  const x0 = cx - S * 2.3, x1 = cx + S * 2.3;
  for (let i = 0; i <= 30; i++) { const y = cy - S * 0.7 + (S * 1.4 * i) / 30; tctx.lineTo(x0 + (x1 - x0) * rev + noise1(i * 0.6, 3) * S * 0.12, y); }
  tctx.lineTo(x0, cy + S * 0.7); tctx.lineTo(x0, cy - S * 0.7); tctx.closePath(); tctx.clip();
  tctx.fillStyle = '#171a24'; tctx.font = '900 ' + Math.round(S) + 'px ' + SERIF;
  tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
  tctx.fillText('米勒星球', cx, cy);
  tctx.globalCompositeOperation = 'destination-out';
  for (const [x, y, r, a] of SPECK) { tctx.globalAlpha = 0.2 + 0.6 * a; tctx.beginPath(); tctx.arc(cx + x * S * 4.4, cy + y * S * 1.1, r * S * 2.5, 0, Math.PI * 2); tctx.fill(); }
  tctx.restore();
  const ks = easeOut(invLerp(0.4, 0.55, k), 3);
  if (ks > 0) {
    const sx = cx + S * 2.3, sy = cy + S * 0.25, ss = S * 0.42 * (1.25 - 0.25 * ks);
    tctx.save(); tctx.globalAlpha = ks; tctx.translate(sx, sy); tctx.rotate(-0.06);
    tctx.fillStyle = '#c8372b'; tctx.fillRect(-ss / 2, -ss / 2, ss, ss);
    tctx.fillStyle = '#f7f6f1'; tctx.font = '700 ' + Math.round(ss * 0.36) + 'px ' + SERIF; tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
    tctx.fillText('一时', 0, -ss * 0.2); tctx.fillText('七年', 0, ss * 0.22);
    tctx.restore();
  }
  const kc = smooth(invLerp(0.3, 0.55, k));
  if (kc > 0) {
    tctx.globalAlpha = kc; tctx.textAlign = 'center';
    tctx.fillStyle = '#1f2230'; tctx.font = '600 ' + Math.round(H * 0.04) + 'px ' + SERIF;
    tctx.fillText('那不是山，是浪', cx, cy + S * 1.05);
    tctx.fillStyle = '#4a4c5a'; tctx.font = '400 ' + Math.round(H * 0.024) + 'px -apple-system, "PingFang SC", sans-serif';
    tctx.fillText('致敬《星际穿越》(2014) · 非官方同人 · 画面与声音全部由 JavaScript 实时生成', cx, cy + S * 1.62);
    tctx.globalAlpha = 1;
  }
}

function renderFrame(n) {
  const st = stateFor(clamp(n, 0, FRAMES - 1));
  if (P.get('cam')) st.cam = { pos: P.get('cam').split(',').map(Number), look: (P.get('at') || '0,1,0').split(',').map(Number), fov: +(P.get('fov') || 30) };   // review camera
  U.uTime.value = st.t; U.uDraw.value = onTwos(st.t);
  const c = st.cam;
  camera.position.set(...c.pos); camera.up.set(0, 1, 0); camera.lookAt(_v.set(...c.look));
  camera.fov = c.fov; camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  world.update(st, camera);
  ranger.update(st.ranger, st);
  wreck.update(st.wreck, st);
  caseBot.root.visible = !!st.case;
  if (st.case) caseBot.update(st.case);
  // Brand rides on CASE's side once it has her
  let brand = st.brand;
  if (!brand && st.case && st.case.carry) {
    const c = st.case, side = [Math.cos(c.yaw), -Math.sin(c.yaw)];
    brand = { pos: [c.pos[0] + side[0] * 1.1, c.pos[1] + side[1] * 1.1], y: 0.9 * c.carry, yaw: c.yaw, lie: c.carry, gait: 0, phase: 0 };
  }
  const people = [st.cooper, brand, st.doyle];
  astros.forEach((a, i) => { a.root.visible = !!people[i]; if (people[i]) a.update(people[i]); });
  const wv = world.seaU.uWade.value;
  people.forEach((p, i) => { if (p) wv[i].set(p.pos[0], p.pos[1], st.t * 1.4 + i * 0.37, (p.gait ?? 0) > 0.15 || p.kneel ? 1 : 0); else wv[i].w = 0; });
  const cs = st.case;
  if (cs && cs.wheel > 0.5) wv[3].set(cs.pos[0], cs.pos[1], st.t * 3.0, 1); else wv[3].w = 0;
  const rp = st.ranger.pos;
  spray.update(st, [
    { x: rp[0], y: rp[1], z: rp[2], on: rp[1] < 2 ? st.ranger.engine * 1.4 : 0, size: 1 },
    { x: cs ? cs.pos[0] : 0, y: 0, z: cs ? cs.pos[1] : 0, on: cs ? smooth(invLerp(0.5, 1, cs.wheel)) : 0, size: 0.2 },
  ], camera.position);
  scene.updateMatrixWorld(true);
  post.render(scene, null, camera, { frame: st.frame, fade: st.fade, fadeColor: st.fadeColor, flash: st.flash, inkSeed: Math.floor(st.t * 12) % 5 });
  drawTitle(st);
  return st;
}

// ---- player
const ui = { play: document.getElementById('play'), big: document.getElementById('big'), scrub: document.getElementById('scrub'), lbl: document.getElementById('lbl'), loop: document.getElementById('loop') };
ui.scrub.max = FRAMES - 1;
let audioBuf = null, actx = null, src = null, playing = false, t0 = 0, shown = -1;
const soundReady = renderSoundtrack().then((b) => (audioBuf = b)).catch((e) => console.warn('sound', e));
function show(n) { if (n === shown) return; shown = n; renderFrame(n); ui.scrub.value = n; ui.lbl.textContent = (n / FPS).toFixed(2) + ' s'; }
function stopSound() { if (src) { try { src.stop(); } catch (e) {} src = null; } }
async function play() {
  await soundReady;
  if (!actx && audioBuf) actx = new AudioContext();
  if (actx && actx.state === 'suspended') await actx.resume();
  const startT = shown >= FRAMES - 1 ? 0 : Math.max(0, shown) / FPS;
  const now = actx ? actx.currentTime : performance.now() / 1000;
  t0 = now - startT;
  stopSound();
  if (actx && audioBuf) { src = actx.createBufferSource(); src.buffer = audioBuf; src.connect(actx.destination); src.start(0, startT); }
  playing = true; document.body.classList.add('playing'); ui.play.textContent = '❚❚';
}
function pause() { playing = false; stopSound(); document.body.classList.remove('playing'); ui.play.textContent = '▶'; }
function tick() {
  if (playing) {
    const now = actx ? actx.currentTime : performance.now() / 1000;
    const t = now - t0;
    if (t >= DURATION) { if (ui.loop.checked) { show(0); playing = false; play(); } else { show(FRAMES - 1); pause(); } }
    else show(Math.floor(t * FPS));
  }
  requestAnimationFrame(tick);
}
ui.play.onclick = ui.big.onclick = () => (playing ? pause() : play());
ui.scrub.oninput = () => { pause(); show(+ui.scrub.value); };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
  if (e.key === 'ArrowRight') { pause(); show(Math.min(FRAMES - 1, shown + 1)); }
  if (e.key === 'ArrowLeft') { pause(); show(Math.max(0, shown - 1)); }
});
const first = P.get('frame') ? +P.get('frame') : P.get('t') ? Math.round(+P.get('t') * FPS) : Math.round(20.5 * FPS);
show(first);
if (P.get('headless') === '1') document.body.classList.add('headless');
window.FILM = { FPS, FRAMES, renderFrame: (n) => { show(n); return true; }, soundReady, stateFor };
window.FILM_READY = true;
requestAnimationFrame(tick);
