#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution

// mcguirev10
#define iTime (time * 0.2 + (texture(eyecandyShadertoy, vec2(0.07, 0.25)).g * 5.0))

#define R(p,a,r) mix(a*dot(p,a),p,cos(r))+sin(r)*cross(p,a)
#define H(h) (cos((h)*6.3+vec3(0,23,21))*.5+.5)

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(91.3458, 47.9898))) * 43758.5453123);
}

vec3 aces_approx(vec3 v) {
  v = max(v, 0.0);
  v *= 0.6;
  float a = 10.51;
  float b = 0.13;
  float c = 1.93;
  float d = 0.19;
  float e = 0.14;
  return clamp((v * (a * v + b)) / (v * (c * v + d) + e), 0.0, 1.0);
}

#define PI 3.141592
mat2 rotationMatrix(float angle)
{
	angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, -s, 
                 s,  c );
}

void main()
{
  fragColor = vec4(0);
  vec3 p = vec3(0);
  vec3 q = vec3(0);
  vec3 r = vec3(resolution.xy, 0.0);
  
  // mcguirev10
  vec2 uv = (fragCoord * 2. - r.xy) / r.y;
  uv *= rotationMatrix(time * (randomrun - 0.5) * 30.0);
  vec3 d = normalize(vec3(uv, 1.));


  for (float i = 0., a, s, e, g = 0.; ++i < 110.;) {
    float randomOffset = hash(vec2(i, iTime));
    p = g * d + vec3(randomOffset * 0.1);
    p.z += iTime * 6.5;
    
    a = 10. + randomOffset * 2.;
    p = mod(p - a, a * 2.) - a;
    s = 6. + randomOffset * 1.2;

    for (int j = 0; j++ < 8;) {
      p = .3 - abs(p);

      p.x < p.z ? p = p.zyx : p;
      p.z < p.y ? p = p.xzy : p;

      s *= e = 1.4 + sin(iTime * .234) * .1;
      p = abs(p) * e - vec3(5. + sin(iTime * .3 + .5 * tan(iTime * .3)) * 3., 120, 8. + cos(iTime * .2) * 5.);
    }
    g += e = length(p.yz) / s;
    g += e = length(p.yx) / s;
    fragColor.xyz += mix(vec3(1), H(g * .1), sin(.8)) * 1. / e / 8e3;
  }

  //vec3 godrayEffect = godray(fragColor.xyz, normalize(vec3((fragCoord * 2.0 - iResolution.xy) / iResolution.y, 1.0)));
  //fragColor.xyz = mix(fragColor.xyz, godrayEffect, 0.5);
  fragColor.xyz = aces_approx(fragColor.xyz);
}
