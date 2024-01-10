#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution

#define PI (3.14159265359)
#define TWOPI (3.14159265359*2.0)
#define temporalSpeed 6.0

#define sound input0
#define to01(x) clamp(x,0.0,1.0)

float min_channel(vec3 v)
{
	float t = (v.x<v.y) ? v.x : v.y;
	t = (t<v.z) ? t : v.z;
	return t;
}

float max_channel(vec3 v)
{
	float t = (v.x>v.y) ? v.x : v.y;
	t = (t>v.z) ? t : v.z;
	return t;
}

vec3 rgb_to_hsv(vec3 RGB)
{
	vec3 HSV = vec3(0,0,0);
	float minVal = min_channel(RGB);
	float maxVal = max_channel(RGB);
	float delta = maxVal - minVal; //Delta RGB value 
	HSV.z = maxVal;
	// If gray, leave H & S at zero
	if (delta != 0.0) { 
		HSV.y = delta / maxVal;
		vec3 delRGB;
		delRGB = ( ( vec3(maxVal) - RGB ) / 6.0 + ( delta / 2.0 ) ) / delta;
		if      ( RGB.x == maxVal ) HSV.x = delRGB.z - delRGB.y;
		else if ( RGB.y == maxVal ) HSV.x = 1.0/3.0 + delRGB.x - delRGB.z;
		else if ( RGB.z == maxVal ) HSV.x = 2.0/3.0 + delRGB.y - delRGB.x;
		if ( HSV.x < 0.0 ) { HSV.x += 1.0; }
		if ( HSV.x > 1.0 ) { HSV.x -= 1.0; }
	}
	return (HSV);
}
vec3 hsv_to_rgb(vec3 HSV)
{
	vec3 RGB = HSV.zzz;
	if ( HSV.y != 0.0 ) {
		float var_h = HSV.x * 6.0;
		float var_i = floor(var_h); // Or ... var_i = floor( var_h )
		float var_1 = HSV.z * (1.0 - HSV.y);
		float var_2 = HSV.z * (1.0 - HSV.y * (var_h-var_i));
		float var_3 = HSV.z * (1.0 - HSV.y * (1.0-(var_h-var_i)));
		if      (var_i == 0.0) { RGB = vec3(HSV.z, var_3, var_1); }
		else if (var_i == 1.0) { RGB = vec3(var_2, HSV.z, var_1); }
		else if (var_i == 2.0) { RGB = vec3(var_1, HSV.z, var_3); }
		else if (var_i == 3.0) { RGB = vec3(var_1, var_2, HSV.z); }
		else if (var_i == 4.0) { RGB = vec3(var_3, var_1, HSV.z); }
		else                 { RGB = vec3(HSV.z, var_1, var_2); }
	}
	return (RGB);
}


#define fftMin 0.1
#define fftH 2.0

float fftmul(float i){
    return i*fftH*(i*fftH+0.8)*1.5 + 0.1;
}

float lum(float k){
    return k;
    return sqrt(k);
}

float spectr(float k){
    return 2.0*abs(k*k*k);
    return k;
    return 1.2*k*k;
}

vec4 fft(float freq,float time){
    return texture(sound,vec2(freq,time));
}

#define sqr(x) (x*x)

float repeat(float x,float y){
    x = mod(x,2.0*y);
    if( x > y ){
        x = 2.0*y - x;
    }
    //return x;
    return mod(x+y,y);
}

vec4 bar(vec2 uv){
    float mul = fftmul( uv.y );
    vec4 fft1 = fft(uv.x,0.0);
    
	return vec4(
        mul*float(fft1.r - fftMin > fftH*uv.y),
        mul*float(fft1.g - fftMin > fftH*uv.y) ,
        mul*float(fft1.b - fftMin > fftH*uv.y) ,
        1.0);
}

void main() {
	vec2 uv = fragCoord.xy / iResolution.xy;
    float minCoord = min(iResolution.x,iResolution.y);
    float maxCoord = max(iResolution.x,iResolution.y);
	float freq = uv.x;
    
        
	fragColor = bar(uv);
	fragColor += bar(vec2(1.0) - uv);
    
    // see spectrogram
    vec2 v = (fragCoord - iResolution.xy / 2.0) / maxCoord * 1.0;
    freq = repeat(atan(v.y,v.x)/PI*2.0,1.0);
    //float time = 0.0;
    float time = sqr(v.x)+sqr(v.y);//+freq*dx;
    //float time = uv.y/temporalSpeed;
    
    vec4 fft2 = fft(freq,time);
    fft2.rgb = rgb_to_hsv(fft2.rgb);
    
    time /= 8.0;
    fft2.r = mod(fft2.r + abs( fft(freq,0.0).g - 0.3 )*0.2,1.0);
    fft2.g *= pow( abs( 6.0*( fft(0.1,time).b - 0.4 ) / 0.6 ) , 1.5);
    fft2.rgb = hsv_to_rgb(fft2.rgb);
    
    fragColor.r = lum(fragColor.r+spectr(fft2.r));
    fragColor.g = lum(fragColor.g+spectr(fft2.g));
    fragColor.b = lum(fragColor.b+spectr(fft2.b));
    
    
    //fragColor = texture(sound,uv);
}
