#version 450
precision highp float;

// When migrating multi-pass Shadertoy code, it's pretty common for the
// Image buffer to simply passthrough the contents of Buffer A without
// any changes. This can be reused by those shaders as the final pass.

in vec2 fragCoord;
uniform sampler2D inputA;
out vec4 fragColor;

void main()
{
    fragColor = texture(inputA, fragCoord);
}
