#version 450
precision highp float;

in vec2 fragCoord;
uniform sampler2D input0;
uniform sampler2D eyecandyShadertoy;
uniform float randomrun;
out vec4 fragColor;

#define iChannel0 input0
#define iChannel1 eyecandyShadertoy

void main()
{
    // mv10: flicker brightness with the music
    vec3 col = texture(iChannel0, fragCoord).rgb * (texture(iChannel1, vec2(0.08, 0.25)).g * 5.0);
    fragColor = vec4(col, 1);
}
