#version 460
precision highp float;

// This is the same basic internal crossfader implemented by
// Monkey Hi Hat when crossfade randomization is disabled.
// By convention any filename crossfade_*.frag is assumed to be
// a transition shader that can be randomly selected by the MHH
// Crossfade renderer. These are found and cached at startup.

// All crossfade shaders need these:
in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

// The other usual visualization uniforms are available such as
// time, resolution, randomly generated numbers, etc.

// Crossfade-specific uniforms are:
//uniform float fadeDuration;
uniform float fadeLevel;

void main()
{
    vec4 oldTexel = texture(oldBuffer, fragCoord);
    vec4 newTexel = texture(newBuffer, fragCoord);
    fragColor = mix(oldTexel, newTexel, fadeLevel);
}
