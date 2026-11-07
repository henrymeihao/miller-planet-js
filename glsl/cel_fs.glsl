// cel material for the Ranger and the astronauts; mode 1 = white water, mode 2 = emissive
uniform vec3 uColor; uniform float uId, uGloss, uMode;
#include common
#include mrt
#include cel
#include env
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
varying vec3 vLocal;
void main(){
  vec3 n = normalize(vNW);
  if(!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWorld);
  float dist = length(vWorld - cameraPosition);
  vec3 nv = normalize(mat3(viewMatrix) * n);
  if(uMode > 1.5){ writeOut(uColor, nv, vDepth, uId); return; }
  if(uMode > 0.5){
    float ndl = dot(n, uKey) + (vnoise(vWorld.xz * 0.08 + vWorld.y * 0.05) - 0.5) * 0.6;
    vec3 c = mix(vec3(0.66, 0.74, 0.80), vec3(0.94, 0.96, 0.98), step(-0.1, ndl));
    writeOut(haze(c, dist), nv, vDepth, uId);
    return;
  }
  writeOut(haze(cel(uColor, n, v, uGloss, 0.0), dist), nv, vDepth, uId);
}
