#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

uniform float pingpongSeconds = 30.0;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel1 eyecandyShadertoy

#define A(a) mat2(cos((a)*6.2832 + vec4(0, -1.5708, 1.5708, 0)))
#define H(a) (cos(radians(vec3(0, 60, 120))+(a)*6.2832)*.5+.5)

// ludicrous
#define R resolution
//#define R iResolution.xy

float cube(vec3 p, mat2 h, mat2 v)
{
    float x = texture(iChannel1, vec2(0.1, 0.25)).g;

    p.yz *= h;
    p.xz *= v;

    p = abs(p);
    float a = max(p.x, max(p.y, p.z)) - 2.414 * (1.0 + x);

    p = abs(p - round(p));
    float b = max(p.x, max(p.y, p.z)) - 0.3 * (1.0 + x);

    return max(a, b);
}

// mcguirev10 - cycles always-increasing value a through 0.0 to b, then back to 0.0
float pingpong(float a, float b)
{
    return (b == 0.0) ? 0.0 : abs(fract((a - b) / (b * 2.0)) * b * 2.0 - b);
}

void main()
{
    // mcguirev10 - the original zoomed too far at multiples of about 60 sec,
    // then reset around 75 sec... ping-pong at ~30sec looks better to me
    float t = pingpong(iTime, pingpongSeconds) / 60.0;
    //float t = iTime / 60.0;

    float s = 1.0;
    float d = 0.0;
    float i = d;
    float r = 0.0;
    float r2 = 0.0;
    
    float x = texture(iChannel1, vec2(0.2, 0.25)).g;
    float y = texture(iChannel1, vec2(0.05, 0.25)).g;

    vec2 m = vec2((R.y + sin(x)) / R.y, 1.0);
       
    vec3 o = vec3(0, -6, -40.0 / (m.y + 1.0));
    vec3 u = normalize(vec3(fragCoord - 0.5 * R, R.y * sin(3.141592 * t * pow(t, 0.55))));
    vec3 c = vec3(0.1);
    vec3 p = vec3(0);
    
    mat2 h = A(m.x);
    mat2 v = A(m.y/30.);
    mat2 ch = A(cos(iTime/2.)*.1);
    mat2 cv = A(sin(-iTime/2.)*.5);
    
    for (; i++<90.;)
    {
        p = o+u*d;
        p.yz *= v;
        p.xz *= h;
        r = length(p.xz);
        r2 = length(p);
        s = cube(p, ch, cv);
        s = min(s, max(length(p)-5.5, 5.4-length(p.xy)));
        p.xz = vec2( atan(p.x, p.z)/6.2832, r );
        p.x -= round(p.z)*t*sign(p.y);
        p.xz = abs(p.xz-round(p.xz));
        p.y = abs(p.y)-15.+3.*x;
        s = min(s, max(abs(p.y) - min(12.*y, 20./r), max(p.x, p.z) - min(1., .5/r)) );
        
        if (s < .001 || d > 1e3) break;
        d += s*.5;
        c += min(vec3(s), .003/s * (H(s + 5./r2 - .1)*.6+.1));
    }
    
    fragColor = vec4(c*c, 1);
}
