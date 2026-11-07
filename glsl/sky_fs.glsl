// painted overcast: long stratus bands in two cel tones, brighter round the hidden sun
#include common
#include mrt
#include env
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
void main(){
  vec3 d = normalize(vWorld - cameraPosition);
  vec3 col = skyCol(d);
  float el = d.y, az = atan(d.x, -d.z);
  // stratus: stretched noise, posterised into a lit and a shade tone
  vec2 q = d.xz / (max(el, 0.0) + 0.12);
  float b = fbm2(q * vec2(0.55, 1.6) + vec2(0.0, 3.0));
  float band = smoothstep(0.50, 0.52, b) * smoothstep(0.02, 0.10, el);
  float lit = smoothstep(0.60, 0.62, b + 0.25 * max(dot(d, uSun), 0.0));
  vec3 shade = mix(col, vec3(0.42, 0.50, 0.62), 0.55), bright = mix(col, vec3(0.86, 0.90, 0.94), 0.6);
  col = mix(col, shade, band * (1.0 - lit));
  col = mix(col, bright, band * lit);
  // thin bright edges where the bands break
  col += vec3(0.9, 0.93, 1.0) * 0.12 * (smoothstep(0.495, 0.5, b) - smoothstep(0.5, 0.505, b)) * smoothstep(0.03, 0.1, el);
  if(el < 0.0) col = uFog;
  writeOut(col, vec3(0.0, 0.0, 1.0), 6000.0, 0.0);
}
