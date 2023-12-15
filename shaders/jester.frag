#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputA
#define iChannel1 eyecandyShadertoy

#define PI 3.141592
mat2 rotationMatrix(float angle)
{
	angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, -s, 
                 s,  c );
}

#define TAU 2.*PI
#define hue(v) ( .6 + .6 * cos( 6.3*(v) + vec3(0,23,21) ) )
#define SIN(x) (sin(x)*.5+.5)
#define BEND .8     
#define rot(a) mat2(cos(a), sin(a), -sin(a), cos(a))
#define COUNT 120.
#define DISTORT 1.5
#define COLOR 1.
#define SPIRAL 3.

#define WATERCOLOR
#define FFT 2.5


float tt, bass;

// zucconis spectral palette https://www.alanzucconi.com/2017/07/15/improving-the-rainbow-2/
vec3 bump3y (vec3 x, vec3 yoffset)
{
    vec3 y = 1. - x * x;
    y = clamp((y-yoffset), vec3(0), vec3(1));
    return y;
}

float bassFFT() {
    int bandLimit = 5;
    
    float avg = 0.;
    for(int i=0; i<bandLimit; i++) {
        avg += texelFetch(iChannel1, ivec2(i, 0), 0).g;
    }
    return avg/float(bandLimit);
}

vec3 spectral_zucconi6(float x) {
    x = fract(x);
    const vec3 c1 = vec3(3.54585104, 2.93225262, 2.41593945);
    const vec3 x1 = vec3(0.69549072, 0.49228336, 0.27699880);
    const vec3 y1 = vec3(0.02312639, 0.15225084, 0.52607955);
    const vec3 c2 = vec3(3.90307140, 3.21182957, 3.96587128);
    const vec3 x2 = vec3(0.11748627, 0.86755042, 0.66077860);
    const vec3 y2 = vec3(0.84897130, 0.88445281, 0.73949448);
    return bump3y(c1 * (x - x1), y1) + bump3y(c2 * (x - x2), y2) ;
}

float triangle(vec2 uv, float w, float blur) 
{
  int N = 3;

  // Angle and radius from the current pixel
  float a = atan(uv.x,uv.y)+PI;
  float r = TAU/float(N);

  // Shaping function that modulate the distance
  float d = 1.-cos(floor(.5+a/r)*r-a)*length(uv);
  return smoothstep(blur, .0, abs(d)-w)*(0.4/blur);
}

vec3 spiral(vec2 uv, float z) 
{
    // mcguirev10: Shadertoy iMouse is 0 to resolution.xy. This viz uses mouse position
    // X to alter color, but anything above about 30 gets washed out, so this cycles 0-30.
    vec3 iMouse = vec3(15.0 * sin(time) + 15.0);
    iMouse = vec3(0.);

    uv *= rot((z*TAU-.2*tt)*(SPIRAL*.3));

    float soundMod = bass*FFT*(3.*sqrt(z)+.2);
    float dist = DISTORT * sin(.5*PI+iMouse.x/640.*2.*PI);
    uv *= 1.3*dist*sin(vec2(5)*uv.yx+.8*tt);

    float blur = exp(-19.*z);
    float luma = exp(-22.5*z);
    return triangle(uv, 0.05, blur)*spectral_zucconi6(fract(2.*z+.2*tt+uv.x*.2+.4*bass*sqrt(z)*2.*FFT))*luma;
}

void main() 
{
    vec2 uv = (fragCoord - .5*iResolution.xy)/iResolution.y;
    
    // mcguirev10 - rotation is fun
    uv *= rotationMatrix(time * 24.0 * (randomrun - 0.5) + (4.0 * sign(randomrun - 0.5)));

    vec3 col = vec3(0);
    vec4 tex = texture(iChannel0, fragCoord/iResolution.xy);
    
    // mcguirev10: bizarre... clears the screen???
    //if (tex.a != iResolution.x) tex = vec4(0);
    
    tt = iTime*.2;
    
    bass = bassFFT();

    uv = abs(uv)-.15;
    uv *= rot(2./8.*PI);
    uv = abs(uv)-.15;
  
    uv *= 15.;

    float s = 1./COUNT;
    
    for(float i=0.; i<1.; i+=s) {   
        float z = fract(i-.1*tt);
        float fade = smoothstep(1., .9, z);
        vec2 UV = uv;
        col += spiral(UV*z, z)*fade;
    }
    col = pow(col, vec3(0.5));
    #ifdef WATERCOLOR
    col = 1.05-col;
    col = pow(col, vec3(2.2));
    col = clamp(col, vec3(0), vec3(1));
    #endif
    col = mix(col, tex.rgb, 0.9);

    fragColor = vec4(col, 1.0);
}