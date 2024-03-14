#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D noise;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 noise
#define iChannel1 inputA
#define iChannel2 eyecandyShadertoy

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

float _seed;
float rand()
{
    _seed++;
    return hash11(_seed);
}

//#define FFT(a) ((texture(iChannel2, vec2(a,0)).r+.05)*10.)
// mcguirev10 - needs tweaking (original was pretty weakly responsive too)
#define FFT(a) ((texture(iChannel2, vec2(a / 4.0, 0.25)).r + 0.05) * 40.0)

vec2 map(vec3 p)
{
    vec2 acc = vec2(10000.,-1.);
    
    vec3 op = p;
    vec3 rep = vec3(1.);
    vec3 id = floor((p+rep*.5)/rep);
    p = mod(p+rep*.5,rep)-rep*.5;
    p.xz *= r2d(id.y+iTime);
    p.xy *= r2d(sin(id.z)+iTime*.3);
    vec3 sz = FFT(length(id))*rep*.3 * (sin((id.x)*length(id)+iTime)*.5+.5);
    float shape = mix(_cucube(p, sz, vec3(.02)), length(p)-length(sz), sin(iTime)*.5-.5);
    shape = max(shape, -(length(op)-5.));
    acc = _min(acc, vec2(shape, 0.));
    
    return acc;
}

vec3 getNorm(vec3 p, float d)
{
    vec2 e = vec2(0.001, 0.);
    return normalize(vec3(d)-vec3(map(p-e.xyy).x, map(p-e.yxy).x, map(p-e.yyx).x));
}

vec3 getCol(vec3 p, vec3 n)
{
    vec3 col = n*.5+.5;
    col.xy *= r2d(p.z*5.+iTime);
    col.yz *= r2d(sin(p.y*5.)-iTime);
    col = abs(col);
    return n*.5+.5;
}

vec3 accCol;
vec3 trace(vec3 ro, vec3 rd, int steps)
{
    accCol = vec3(0.);
    vec3 p = ro;
    for (int i = 0; i < steps && distance(p, ro) < 10.; ++i)
    {
        vec2 res = map(p);
        if (res.x < 0.001)
            return vec3(res.x, distance(p, ro), res.y);
        p+=rd*res.x*.5;
        rd = normalize(rd-.01*normalize(p));
        accCol += getCol(p, normalize(p))*(1.-sat(res.x/.52))*.005;
    }
    return vec3(-1.);
}

vec3 rdr(vec2 uv)
{
    vec3 col = vec3(0.);
    
    float t= sin(iTime*.25);
    float d = 5.+3.*sin(iTime*.33);
    vec3 ro = vec3(sin(t)*d,-5.*sin(t*.25)*d,cos(t)*d);
    vec3 ta = vec3(0.,0.,0.);
    vec3 rd = normalize(ta-ro);
    
    rd = getCam(rd, uv);
    vec3 res = trace(ro, rd, 128);
    if (res.y > 0.)
    {
        vec3 p = ro+rd*res.y;
        vec3 n = getNorm(p, res.x);
        col = getCol(p, n);
    }
    col += accCol;
    return col;
}

void main()
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.xx;
    _seed = iTime+texture(iChannel0, uv).x;
    //vec2 off = .75*(vec2(rand(), rand())-.5)*2.*1./iResolution.x;
    vec3 col = rdr(uv);
    
    vec2 off = vec2(1., -1.)/(iResolution.x*1.5);

    if (true)// Not so cheap antialiasing
    {
        vec3 acc = col;
        acc += rdr(uv+off.xx);
        acc += rdr(uv+off.xy);
        acc += rdr(uv+off.yy);
        acc += rdr(uv+off.yx);
        col = acc/5.;
        
    }
    col *= 2.5/(col+1.);
    //col = pow(col, vec3(.4545));
    col = mix(col, texture(iChannel1, fragCoord/iResolution.xy).xyz, .2);
    col = sat(col);
    fragColor = vec4(col,1.0);
}
