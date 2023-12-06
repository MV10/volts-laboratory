#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution

// mcguirev10
#define iTime (time * 0.01 + (texture(eyecandyShadertoy, vec2(0.07, 0.5)).g * 25.0))

#define R(p,a,r)mix(a*dot(p,a),p,cos(r))+sin(r)*cross(p,a)
#define H(h)(cos((h)*6.3+vec3(0,23,21))*.5+.5)

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

vec3 godray(vec3 bg, vec3 r) {
  float x = atan(r.x, r.z); 
  float y = acos(r.y) - 3.14159 * 0.5;   
  
  x *= 0.5;
  y *= 0.5;
    
  vec3 col = bg * (1.0 + y);
    
  float t = iTime + hash(r.xy);

  float a = sin(r.x);
    
  float beam = clamp(sin(10.0 * x + a * y * 5.0 + t), 0.0, 1.0);
  beam *= clamp(sin(7.0 * x + a * y * 3.5 - t), 0.0, 1.0);
    
  float beam2 = clamp(sin(42.0 * x + a * y * 21.0 - t), 0.0, 1.0);
  beam2 *= clamp(sin(34.0 * x + a * y * 17.0 + t), 0.0, 1.0);
    
  beam += beam2;
  
  col += beam * 0.25 * sqrt(bg);
  return col;
}

void main()
{
  fragColor = vec4(0);
  vec3 p = vec3(0);
  vec3 q = vec3(0);
  vec3 r = vec3(resolution.xy, 0.0);
  vec3 d = normalize(vec3((fragCoord * 2. - r.xy) / r.y, 1.));  

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

  vec3 godrayEffect = godray(fragColor.xyz, normalize(vec3((fragCoord * 2.0 - iResolution.xy) / iResolution.y, 1.0)));
  fragColor.xyz = mix(fragColor.xyz, godrayEffect, 0.5);
  fragColor.xyz = aces_approx(fragColor.xyz);
}
