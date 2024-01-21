#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform float time;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iFrame frame
#define iTime time
#define iChannel0 inputA
#define iChannel1 eyecandyShadertoy

void main()
{
    vec2 q = fragCoord.xy/iResolution.xy;
    float fft  = texture( iChannel1, vec2(q.x,0.25) ).y;
	float nwave = texture( iChannel1, vec2(q.x,0.75) ).y;
    vec4 lData = texture( iChannel0, vec2(q.x,0.25) );
    
    float fwave = mix(nwave,lData.z, .9);

    float nfft = 0.;
    for (float i = 0.0; i < 1.; i += 0.02)
    {
        nfft += texture( iChannel1, vec2(i,0.25) ).y; 
    }
    nfft = clamp(nfft/50.,0.,1.);
    
    float ffts = mix(nfft, lData.w, 0.5);
    
    if (iFrame < 5) 
    {
        fft = 0.;
        fwave= .5;
        ffts = 0.;
    }
    
    fragColor = vec4(fft, 0, fwave, ffts);
}
