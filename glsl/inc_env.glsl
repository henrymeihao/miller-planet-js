// shared look of Miller's planet: overcast sky, haze, the wave's ridge line
uniform vec3 uSun;      // hazy sun behind the overcast
uniform vec3 uFog;      // horizon haze colour
uniform vec4 uWave;     // crest z, height, lean, -
float ridge(float x){ return 0.80 + 0.11 * sin(x * 0.0021 + 1.3) + 0.07 * sin(x * 0.0057 + 4.1) + 0.04 * sin(x * 0.011 + 2.0) + 0.025 * sin(x * 0.027 + 0.7); }
vec3 skyCol(vec3 d){
  float el = max(d.y, 0.0);
  vec3 c = mix(uFog, vec3(0.50, 0.62, 0.74), pow(el, 0.55));
  float sd = max(dot(d, uSun), 0.0);
  c += vec3(1.0, 0.97, 0.9) * (pow(sd, 6.0) * 0.08 + pow(sd, 80.0) * 0.12);
  return c;
}
vec3 haze(vec3 col, float dist){ return mix(col, uFog, smoothstep(250.0, 4200.0, dist) * 0.72); }
