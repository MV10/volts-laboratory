#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input1
#define iChannel1 input0

//////////////////////////////////////////////////////////
// Shadertoy Common tab
#define GLOW_SAMPLES 80
#define GLOW_DISTANCE 0.2
#define GLOW_POW .3
#define GLOW_OPACITY .6

#define sat(a) clamp(a, 0., 1.)
#define PI 3.14159265
#define TAU (PI*2.0)

mat2 r2d(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash11(float seed)
{
    return mod(sin(seed*123.456789)*123.456,1.);
}

vec3 getCam(vec3 rd, vec2 uv)
{
    float fov = 5.;
    vec3 r = normalize(cross(rd, vec3(0.,1.,0.)));
    vec3 u = normalize(cross(rd, r));
    return normalize(rd+fov*(r*uv.x+u*uv.y));
}

vec2 _min(vec2 a, vec2 b)
{
    if (a.x < b.x)
        return a;
    return b;
}

float _cucube(vec3 p, vec3 s, vec3 th)
{
    vec3 l = abs(p)-s;
    float cube = max(max(l.x, l.y), l.z);
    l = abs(l)-th;
    float x = max(l.y, l.z);
    float y = max(l.x, l.z);
    float z = max(l.x, l.y);
    
    return max(min(min(x, y), z), cube);
}

float _cube(vec3 p, vec3 s)
{
    vec3 l = abs(p)-s;
    return max(l.x, max(l.y, l.z));
}
/////////////////////////////////////////////////////////

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    const int steps = GLOW_SAMPLES;
    vec3 col = vec3(0.);
    
    for (int i = 0; i< steps; ++i)
    {
        float f = float(i)/float(steps);
        f = (f -.5)*2.;
        float factor = GLOW_DISTANCE;
        vec2 nuv = uv+vec2(0.,f*factor);
        if (nuv.y > 0. && nuv.y < 1.)
            col += texture(iChannel0, uv+vec2(0.,f*factor)).xyz/float(steps);
    }
    
    vec3 rgb = texture(iChannel1, uv).xyz+GLOW_OPACITY*pow(col, vec3(GLOW_POW));
    rgb = pow(rgb*1.2, vec3(2.2));
    vec2 cuv = (fragCoord-.5*iResolution.xy)/iResolution.xx;
    
    fragColor = vec4(rgb,1.0);
}
