#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputB;
uniform sampler2D inputC;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputC
#define iChannel1 inputB

void main()
{
    vec2 px = 2.5 / vec2(640.0,360.0);
	vec2 uv = fragCoord.xy / iResolution.xy;
    vec4 tx = texture(iChannel1,uv);
    float dist = distance(tx,texture(iChannel1,uv+px));
    px.y *= -1.0;
    dist += distance(tx,texture(iChannel1,uv+px));
    px.x *= -1.0;
    dist += distance(tx,texture(iChannel1,uv+px));
    px.y *= -1.0;
    dist += distance(tx,texture(iChannel1,uv+px));
    uv *= mat2(0.999,0.001,-0.001,0.999);
	fragColor = texture(iChannel0,uv*0.995+0.0025)*vec4(0.93,0.91,0.0,0.0)+
        vec4(smoothstep(0.05,1.3,dist),smoothstep(0.1,2.8,dist),0.0,1.0)*.245;
}
