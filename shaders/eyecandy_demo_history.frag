#version 320 es
precision highp float;

in vec2 fragCoord;
uniform sampler2D sound;
out vec4 fragColor;

// The point of the eyecandy frag demos is the
// audio texture data, so we just write out the
// underlying texture to the full-screen quad
// with no changes.

void main()
{
    fragColor = texture(sound, fragCoord);
}
