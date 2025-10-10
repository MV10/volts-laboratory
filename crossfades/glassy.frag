#version 450
precision highp float;

// Adapted from https://www.shadertoy.com/view/ls3Xzj
// My revisions https://www.shadertoy.com/view/X3jSWh

in vec2 fragCoord;
uniform float fadeLevel;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

#define uv fragCoord
#define iChannel0 oldBuffer
#define iChannel1 newBuffer

void main()
{
    if(fadeLevel >= 1.0) discard;
    vec3 new = texture(newBuffer, uv).rgb * fadeLevel;
    vec3 color = texture(oldBuffer, uv + (1.0 - new.rb) * .2 - 0.187).rgb; // distort the old texture with new colors
    color += 0.2 * new.rgb; // add some of the new color
    fragColor = vec4(mix(clamp(color, 0.0, 1.0), new, fadeLevel), 1.0);
}
