// the wave: gentle grey-blue back, white crest, a dark slate face with sheeting streaks,
// light through the lip, boiling white at the toe. Painted (brushwork, no ink): far away it reads as mountains.
uniform float uTime, uDraw;
#include common
#include mrt
#include env
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
varying float vJ;
void main(){
  vec3 n = normalize(vNW);
  if(!gl_FrontFacing) n = -n;
  float j = vJ, x = vWorld.x;
  float H = uWave.y * ridge(x);
  float k = clamp(vWorld.y / max(H, 1.0), 0.0, 1.2);
  float dist = length(vWorld - cameraPosition);
  float near = smoothstep(2300.0, 1300.0, dist);
  vec3 col;
  float up = n.y;
  if(j < 0.47){
    // back slope: wind-streaked, lighter
    col = mix(vec3(0.27, 0.38, 0.47), vec3(0.38, 0.49, 0.57), step(0.55, vnoise(vec2(x * 0.02, vWorld.z * 0.004))));
    col = mix(col, vec3(0.62, 0.72, 0.78), step(0.8, vnoise(vec2(x * 0.06, vWorld.z * 0.02 - uDraw))) * 0.6);
  } else {
    // face: deep slate low, teal glow near the top where the light comes through
    col = mix(vec3(0.14, 0.21, 0.28), vec3(0.24, 0.40, 0.47), smoothstep(0.35, 0.92, k));
    // vertical sheeting streaks, drawn on twos
    float st = vnoise(vec2(x * 0.11, k * 1.4 - uDraw * 0.6)) * 0.7 + vnoise(vec2(x * 0.03, k * 3.0)) * 0.3;
    col = mix(col, vec3(0.40, 0.54, 0.60), step(0.74, st) * smoothstep(0.1, 0.4, k) * 0.6 * near);
    col = mix(col, vec3(0.09, 0.14, 0.20), step(st, 0.2) * 0.4 * near);
    // light through the lip
    col = mix(col, vec3(0.45, 0.68, 0.72), smoothstep(0.82, 0.97, k) * (0.6 + 0.4 * step(0.4, vnoise(vec2(x * 0.03, k * 6.0)))));
  }
  // overcast lighting in two tones
  col *= mix(0.86, 1.06, step(0.35, up + (vnoise(vWorld.xz * 0.01) - 0.5) * 0.3));
  // white crest and lip foam
  float fn = fbm2(vec2(x * 0.018, j * 30.0 - uDraw * 1.3));
  float crest = smoothstep(0.02, 0.0, abs(j - 0.505) - 0.012 - uWave.z * 0.02 + (fn - 0.5) * 0.04);
  col = mix(col, vec3(0.93, 0.95, 0.97), step(0.5, crest) * near);
  // boiling white at the toe
  float toe = smoothstep(0.88, 0.95, j) * step(0.42, fbm2(vec2(x * 0.03, vWorld.y * 0.08) + uDraw * 0.9));
  col = mix(col, vec3(0.88, 0.92, 0.95), toe);
  col = mix(col, vec3(0.36, 0.44, 0.53), (1.0 - near) * 0.8);   // mountain blue
  writeOut(haze(col, dist), normalize(vNV), vDepth, 0.0);
}
