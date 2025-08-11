#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define iResolution resolution
#define iChannel0 input0

// golfing sucks
#define O fragColor
#define u (fragCoord * resolution)

void main()
{
    vec2 R = iResolution.xy,
        uv = u/R;

    O *= 0.;

    float[] gk1s = float[](
        0.003765, 0.015019, 0.023792, 0.015019, 0.003765,
        0.015019, 0.059912, 0.094907, 0.059912, 0.015019,
        0.023792, 0.094907, 0.150342, 0.094907, 0.023792,
        0.015019, 0.059912, 0.094907, 0.059912, 0.015019,
        0.003765, 0.015019, 0.023792, 0.015019, 0.003765
    );

    for (int k; k < 25; k++)      
        O += gk1s[k] * texture(iChannel0, uv + ( vec2(k%5,k/5) - 2. ) / R );
}
