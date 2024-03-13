#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D inputB;
uniform sampler2D inputC;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 inputB
#define iChannel1 inputC

void main() 
{
    int iFrame = int(frame);
    vec2 uv = fragCoord/iResolution.xy;

    if (iFrame % 30 == 0)
        fragColor = texture(iChannel1, uv);
    else
        fragColor = texture(iChannel0, uv);
}
