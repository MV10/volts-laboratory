#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution

#define buffer inputA
#define sound  eyecandyShadertoy
//#define soundRes iChannelResolution[1]
#define step 1.0/iResolution.y

// fft Options
#define inputSound iChannel0
#define fftWidth 		1.0			// width of fft texture (why not 512.0 ?! )

/* Shadertoy original settings:
#define fftSmooth 		1.3			// smoothness coeff
#define fftPreamp		0.65		// pre amp before dynamic
#define fftBoost  		0.14		// dynamic amp
#define fftAmp			0.7			// pre amp before dynamic
#define fftMinBass 		0.00196 	// 1.0/512.0
#define noiseLevel      0.05
#define fftRadiusR		8.0/512.0
#define fftRadiusG		8.0/512.0*4.0
#define fftRadiusB		8.0/512.0*4.0*4.0
*/

// mcguirev10 - mhh/eyecandy settings:
#define fftSmooth 		1.3         // smoothness coeff
#define fftPreamp		0.55        // pre amp before dynamic
#define fftBoost  		0.14        // dynamic amp
#define fftAmp			0.65        // pre amp before dynamic
#define fftMinBass 		0.0009766   // 1.0/1024.0
#define noiseLevel      0.05
#define fftRadiusR		8.0/1024.0
#define fftRadiusG		8.0/1024.0*4.0
#define fftRadiusB		8.0/1024.0*4.0*4.0

#define fftSamplesR 	8 // number of iteration for fft sampling, increases quality !
#define fftSamplesG 	8*4
#define fftSamplesB 	8*4*4
#define fftGBGain       1.1

#define to01(x) clamp(x,0.0,1.0)

float remapIntensity(float f, float i){
  // noise level
  i = to01( (i - noiseLevel) / (1.0 - noiseLevel) );
  float k = f-1.0;
  // preamp, x2 for trebles -> x1 for bass
  //i *= ( 2.0 - 1.0*k*k ) * fftPreamp;
  //i *= ( 3.0 - 1.5*k*k ) * fftPreamp;
  i *= ( 3.0 - 1.6*k*k ) * fftPreamp;
  // more dynamic
  i *= (i+fftBoost);
  // limiter
  return i*fftAmp;
  // limiter, kills dynamic when too loud
  //return 1.0 - 1.0 / ( i*4.0 + 1.0 );
}

float remapFreq(float freq){
 // linear scale
 //return clamp(freq,fftMinBass,1.0);
 // log scale
 return clamp(to01(- log(1.0-freq/2.0 + fftMinBass*8.0)),fftMinBass,1.0);
}

float fftR(float f){
    float sum = 0.0;
    float val = 0.0;
    float coeff = 0.0;
    float k = 0.0;
    for( int i = 0; i < fftSamplesR ; i++ ){
        k = float(i)/float(fftSamplesR-1)-0.5;
        coeff = exp(-k*k/(fftSmooth*fftSmooth)*2.0);
		val += texture(sound, vec2( remapFreq(f + k * fftRadiusR)*fftWidth, 0.0) ).g * coeff;
        sum += coeff;
    }
    return remapIntensity(f,val/sum);
}

float fftG(float f){
    float sum = 0.0;
    float val = 0.0;
    float coeff = 0.0;
    float k = 0.0;
    for( int i = 0; i < fftSamplesG ; i++ ){
        k = float(i)/float(fftSamplesG-1)-0.5;
        coeff = exp(-k*k/(fftSmooth*fftSmooth)*2.0);
		val += texture(sound, vec2( remapFreq(f + k * fftRadiusG)*fftWidth, 0.0) ).g * coeff;
        sum += coeff;
    }
    return remapIntensity(f,val/sum)*fftGBGain;
}

float fftB(float f){
    float sum = 0.0;
    float val = 0.0;
    float coeff = 0.0;
    float k = 0.0;
    for( int i = 0; i < fftSamplesB ; i++ ){
        k = float(i)/float(fftSamplesB-1)-0.5;
        coeff = exp(-k*k/(fftSmooth*fftSmooth)*2.0);
		val += texture(sound, vec2( remapFreq(f + k * fftRadiusB)*fftWidth, 0.0) ).g * coeff;
        sum += coeff;
    }
    return remapIntensity(f,val/sum)*fftGBGain*fftGBGain;
}

void main()
{
    vec2 uv = fragCoord.xy / iResolution.xy;

   	// black by default
    fragColor = vec4(0.0,0.0,0.0,1.0);
    
        // store current fft
        if( fragCoord.y <= 1.0 ){
            
            float freq = uv.x;
            float i1,i2,i3;

            i1 = fftR(freq);
            i2 = fftG(freq);
            i3 = fftB(freq);

            fragColor = vec4(i1,i2,i3,1.0);
            
        // store previous fft
        } else if( fragCoord.y < iResolution.y - 1.0 ) {
            fragColor=texture(buffer,vec2(uv.x,uv.y - step));
        }
}