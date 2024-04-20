#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 eyecandyShadertoy

mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

float gyroid (vec3 p) { return dot(cos(p),sin(p.yzx)); }

float fbm(vec3 p)
{
  float result = 0.;
  float a = .5;
  for (float i = 0.; i < 3.; ++i)
  {
    p += result;
    p.z += iTime*.2;
    result += abs(gyroid(p/a)*a);
    a /= 2.;
  }
  return result;
}

float map(vec3 p)
{
  float sound = texture(iChannel0, vec2(0.07, 0.25)).g * .75;

  float dist = 100.;

  p.xz *= rot(iTime * .2);
  p.xy *= rot(iTime * .1);

  vec3 q = p * sound;
   p = abs(p)-1.3;
  dist = max(p.x, max(p.y, p.z));
  dist -= fbm(q)*.2;
  dist = abs(dist)-.03;
  
  return dist * .5;
}

void main() 
{
    vec2 uv = (fragCoord-iResolution.xy/2.)/iResolution.y;
    
    vec3 color = vec3(smoothstep(1., -1., length(uv)));
    
    vec3 pos = vec3(0,0,7);
    vec3 ray = normalize(vec3(uv, -1.5));
    float total = 0.;
    float shade = 0.;
    for (float i = 100.; i > 0.; --i)
    {
        float dist = map(pos);
        if (dist < .001)
        {
            shade += 0.1;
            dist = 0.002;
        }
        if (total > 10.)
        {
            fragColor = vec4(color, 1.0);
            return;
        }
        total += dist;
        pos += ray * dist;
    }

    if (total < 10.)
    {
        color = 0.5 + 0.5 * cos(vec3(1,2,3)*5.5+shade);
    }
    
    fragColor = vec4(color, 1.0);
}