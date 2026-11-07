// a mirror: the sky and the wave reflected in ankle-deep water, wading rings, foam at the toe
uniform float uTime, uDraw;
uniform vec4 uWade[4];   // x z phase on
#include common
#include mrt
#include env
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
vec3 waveColAt(float y, float H){ float k = y / H; return mix(vec3(0.17, 0.24, 0.31), vec3(0.34, 0.44, 0.52), smoothstep(0.2, 0.95, k)); }
void main(){
  vec3 n = normalize(vNW);
  vec3 v = normalize(cameraPosition - vWorld);
  vec2 p = vWorld.xz;
  float dist = length(vWorld - cameraPosition);
  // ripple normals posterised so the reflection breaks into cel strokes
  float rip = vnoise(vec2(p.x * 0.6, p.y * 2.4) + uDraw * 0.8) - 0.5;
  n = normalize(n + vec3(rip * 0.02, 0.0, rip * 0.05) * smoothstep(400.0, 30.0, dist));
  vec3 r = reflect(-v, n);
  vec3 col = skyCol(r) * 0.92;
  // reflected wave: intersect the reflected ray with the wave face (a wall at z = crest + 0.2 H)
  float zf = uWave.x + 0.2 * uWave.y;
  if(r.z < 0.0 && vWorld.z > zf){
    float s = (zf - vWorld.z) / r.z;
    vec3 hp = vWorld + r * s;
    float Hx = uWave.y * ridge(hp.x);
    if(hp.y < Hx){
      vec3 wc = waveColAt(hp.y, Hx);
      wc = mix(wc, vec3(0.82, 0.86, 0.9), smoothstep(Hx * 0.9, Hx * 0.96, hp.y));
      col = haze(wc * 0.9, length(hp - cameraPosition) + s * 0.3);
    }
  }
  // the bed shows through close to camera: slightly warm, darker
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  col = mix(vec3(0.30, 0.34, 0.33), col, clamp(0.55 + fres * 0.8 + smoothstep(5.0, 40.0, dist) * 0.45, 0.0, 1.0));
  // wading rings
  for(int i = 0; i < 4; i++){
    vec4 w = uWade[i];
    if(w.w < 0.5) continue;
    float d = length(p - w.xy);
    for(int k = 0; k < 3; k++){
      float age = fract(w.z + float(k) / 3.0);
      float ring = abs(d - (0.35 + age * 2.6)) - 0.05 * (1.0 - age);
      col = mix(col, vec3(0.92, 0.95, 0.97), step(ring, 0.0) * (1.0 - age) * step(0.4, vnoise(p * 6.0 + float(k))));
    }
    col = mix(col, vec3(0.95), step(d, 0.32) * step(0.45, vnoise(p * 9.0 + uDraw * 5.0)));
  }
  // foam streaks where the water runs up into the toe
  float dz = vWorld.z - (uWave.x + 0.55 * uWave.y);
  float foam = step(0.0, dz) * smoothstep(0.5 * uWave.y, 0.0, dz) * step(0.62, fbm2(vec2(p.x * 0.05, p.y * 0.012) + uDraw * 0.4));
  col = mix(col, vec3(0.85, 0.89, 0.92), foam * 0.9);
  writeOut(haze(col, dist), normalize(vNV), vDepth, 0.0);
}
