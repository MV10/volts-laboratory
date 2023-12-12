#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputB;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution

void main()
{
    vec2 pos = fragCoord.xy / iResolution.xy;
    vec2 pos2 = fragCoord.xy / iResolution.xy - 0.5;
    float mix = 0.03;
    fragColor =
        texture(iChannel1, pos) * mix
        * 2.5 - 0.02 +
        texture(iChannel0, (pos + 0.005) * 0.99) * (1.0 - mix);
}
