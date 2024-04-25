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

#define R(p,a,r) mix(a*dot(p,a),p,cos(r))+sin(r)*cross(p,a)
#define H(h) (cos((h)*6.3+vec3(0,23,21))*0.5+0.5)

vec3 pow3(vec3 x, int y) 
{
    while (y > 0) 
    {
        x *= x;
        y = y - 1;
    }
    return x;
}

float fft(float x) 
{
    return texelFetch(iChannel0, ivec2(128.0 * x, 0), 0).g; 
 }
    
void main()
{
    fragColor = vec4(0);
         
    float bass = texelFetch(iChannel0, ivec2(1, 0), 0).g; 
    bass = clamp((bass - 0.5) * 2.0, 0.0, 1.0);
   
    vec3 p;
    vec3 r = vec3(iResolution, 1);
    vec3 d = normalize(vec3((bass * 2.0 + fragCoord - 0.5 * r.xy) / r.y, 1));  
    for(
        float i=0.0, g=0.0, e, s;
        ++i < 99.0;
        fragColor.rgb += mix(vec3(r / r), H(log(s)), 0.7) * 0.08 * exp(-i * i * e))
    {
        p= g * d;
        p.z -= 0.6;
        p = R(p, normalize(vec3(1, 2, 3)), iTime * 0.3);
        s = 4.0;
        for(int j=0; j++<8;)
            p = abs(p), p = p.x < p.y ? p.zxy : p.zyx,
            s *= e= 1.8 / min(dot(p, p), 1.3),
            p = p * e - vec3(12, 3, 3) + 2.0 * fft((e) / 99.0);
        g += e = length(p.xz) / s;
    }
 }
