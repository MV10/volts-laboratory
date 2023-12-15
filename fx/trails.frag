#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputB;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputB
#define iChannel1 input0

void main()
{
    vec2 uv = fragCoord / iResolution.xy;
    vec3 ob = texture(iChannel0, uv).rgb;
    vec3 nb = texture(iChannel1, uv).rgb;
    vec3 a = vec3(0.05, 0.2, 0.5) * 0.2;
    fragColor = vec4(mix(ob, nb, a), 1.);
}