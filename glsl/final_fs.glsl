// bloom + high-key anime grade + grain + flash/fade
uniform sampler2D tColor, tBloom1, tBloom2;
uniform float uFrame, uBloom, uFade, uFlash;
uniform vec3 uFadeColor;
varying vec2 vUv; out vec4 o;
#include common
void main(){
  vec3 c = texture(tColor, vUv).rgb;
  c += (texture(tBloom1, vUv).rgb * 0.6 + texture(tBloom2, vUv).rgb * 0.8) * uBloom;
  c = c / (1.0 + max(c - 1.0, 0.0) * 0.6);
  c *= 1.08;
  c = pow(max(c, 0.0), vec3(0.88));
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  float chroma = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  c = mix(vec3(l), c, 1.0 + 0.28 * (1.0 - chroma));
  c = vec3(0.05, 0.04, 0.09) + c * (vec3(1.0, 0.985, 0.955) - vec3(0.05, 0.04, 0.09));
  vec2 q = vUv - 0.5;
  c *= 1.0 - 0.14 * dot(q, q) * 1.6;
  c += (hash12(gl_FragCoord.xy + uFrame * 17.31) - 0.5) * 0.022;
  c = mix(c, vec3(1.0), uFlash);
  c = mix(c, uFadeColor, uFade);
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}
