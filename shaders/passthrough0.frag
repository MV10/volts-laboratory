#version 450
precision highp float;

// When migrating multi-pass Shadertoy code, it's pretty common for the
// Image buffer to simply passthrough the contents of Buffer A without
// any changes. However, the Monkey Hi Hat equivalent is drawing into
// buffer 0, so this is probably more appropriate than passthroughA.
// This can be reused by those shaders as the final pass.

in vec2 fragCoord;
uniform sampler2D input0;
out vec4 fragColor;

void main()
{
    fragColor = texture(input0, fragCoord);
}
