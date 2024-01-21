#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D inputC;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iFrame frame
#define iChannel0 inputC
#define iChannel1 eyecandyShadertoy

// Homecomputer by nimitz 2016 (twitter: @stormoid)
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options

/*
 	The goal of this Buffer is to prepare
	the sound data so that it can be used 
	by the other buffers

	Data output:
	x = fft
	y = waveform
	z = filtered waveform
	w = filtered fft summed over many bands
*/

void main()
{
    vec2 q = fragCoord.xy/iResolution.xy;
    float fft  = texture( iChannel1, vec2(q.x,0.25) ).g;
	float nwave = texture( iChannel1, vec2(q.x,0.75) ).g;
    
    float owave = texture( iChannel0, vec2(q.x,0.25) ).z;
    float offt  = texture( iChannel0, vec2(q.x,0.25) ).w;
    
    
    float fwave = mix(nwave,owave, 0.85);
    
    
    /*
        get fft sum over many bands, this will allow
		to ge tthe current "intensity" of a track
	*/
    float nfft = 0.;
    for (float i = 0.; i < 1.; i += 0.05)
    {
        nfft += texture( iChannel1, vec2(i,0.25) ).g; 
    }
    nfft = clamp(nfft/30.,0.,1.);
    
    float ffts = mix(nfft, offt, 0.8);
    
    if (iFrame < 5) 
    {
        fft = 0.;
        fwave= .5;
        ffts = 0.;
    }
    
    fragColor = vec4(fft, nwave, fwave, ffts);
}