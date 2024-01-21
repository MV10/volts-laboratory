#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define o fragColor
#define iTime time
#define iChannel0 input0
#define iResolution resolution

// Really cheap color visualizer 

#define n 7.         // number of rays
#define T(v) 0.8*texture(iChannel0,abs((v)-fract(p))) 

void main()
{
    vec2 u = fragCoord;

    float time = iTime*0.05;
    vec2 R = iResolution.xy;
    u = (u + u - R) / R.y;
    float t = cos(time+length(u)*20.*sin(time*14.))/10.;
    u *= mat2(cos(t),sin(t),-sin(t),cos(t));
    vec2 p = vec2(exp2(length(u))-16.0*time,0.5*n*atan(u.y,u.x)/acos(-1.));
    o.r = T(0.3).r; 
    o.g = T(0.5).r; 
    o.b = T(0.7).r; 
}
