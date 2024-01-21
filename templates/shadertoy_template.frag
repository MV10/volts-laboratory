#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

// Remember to modify mainImage(foo,bar) to just main()
// Remember to use the GREEN channel on audio textures (Shadertoy uses R or X channel)
//
// Shadertoy        MonkeyHiHat        Conversion
// --------------   --------------     --------------------------------------------------------
// fragCoord        fragCoord          MHH is already normalized (xy = 0.0 to 1.0)
// iResolution      resolution         works the same way but likely unnecessary
// iChannel0..3     eyecandyShadertoy  AudioTextureShadertoy: y0=freq mag, y1=pcm wave
// iTime            time               same, elapsed time in seconds
// iMouse           (n/a)              nullify with vec2(0.5)


// Instead of altering the code, use these:

//#define fragCoord (fragCoord * resolution)
//#define iResolution resolution
//#define iChannel0 eyecandyShadertoy
//#define iTime time
//#define iMouse vec2(0.5)

void main()
{
    fragColor = texture(eyecandyShadertoy, fragCoord);
}
