// shallow water: tiny wind ripples over a flat bed, and the water drawn up into the wave's toe
uniform float uTime;
uniform vec2 uCenter;
uniform vec4 uWave;
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
float H(vec2 p){
  float t = uTime;
  float h = 0.035 * sin(dot(p, vec2(0.31, 0.12)) + t * 1.7) + 0.025 * sin(dot(p, vec2(-0.17, 0.41)) + t * 2.1);
  // the toe: water climbs toward the wave over the last ~0.6 H
  float d = p.y - uWave.x;               // + toward camera
  float toe = 0.55 * uWave.y;
  h += uWave.y * 0.05 * exp(-pow(max(d - toe, 0.0) / (0.35 * uWave.y), 2.0)) * step(0.0, d);
  return h;
}
void main(){
  vec2 p = position.xy;
  vec2 wp = uCenter + sign(p) * p * p * 4200.0;
  float e = 0.3 + length(wp - uCenter) * 0.004;
  float h = H(wp);
  vec3 n = normalize(vec3(H(wp - vec2(e, 0.0)) - H(wp + vec2(e, 0.0)), 2.0 * e, H(wp - vec2(0.0, e)) - H(wp + vec2(0.0, e))));
  vec4 w = vec4(wp.x, h, wp.y, 1.0);
  vWorld = w.xyz; vNW = n; vNV = normalize(mat3(viewMatrix) * n);
  vec4 mv = viewMatrix * w; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
