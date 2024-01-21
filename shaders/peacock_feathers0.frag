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
#define iChannel0 inputA
#define iTime (time+(texture(eyecandyShadertoy, vec2(0.08, 0.5)).g - 0.5)*1.5)

#define PI 3.141592
#define TAU 2.*PI
#define hue(v) ( .6 + .6 * cos( 6.3*(v) + vec3(0,23,21) ) )
#define SIN(x) (sin(x)*.5+.5)
#define BEND .8     
#define rot(a) mat2(cos(a), sin(a), -sin(a), cos(a))
#define COUNT 120.
#define DISTORT 1.5
#define COLOR 1.
#define SPIRAL 3.

float tt;

// zucconis spectral palette https://www.alanzucconi.com/2017/07/15/improving-the-rainbow-2/
vec3 bump3y (vec3 x, vec3 yoffset)
{
    vec3 y = 1. - x * x;
    y = clamp((y-yoffset), vec3(0), vec3(1));
    return y;
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

float triangle(vec2 uv, float w, float blur) {   
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
    // mv10: not sure why this was used, it just makes it go blank at 60 sec
    //float fadeOut = .25*smoothstep(20., 60., iTime);
    float fadeOut = 0.0;
    
    uv *= rot((z*TAU-.2*tt)*(SPIRAL*.3));

    float soundMod = (3.*sqrt(z)+.2);
    float dist = DISTORT * sin(.5*PI+2.*PI*fadeOut);
    uv *= 1.3*dist*sin(vec2(5)*uv.yx+.8*tt);
   // uv += soundMod;
    float blur = exp(-19.*z);
    float luma = exp(-22.5*z);
    return triangle(uv, 0.05, blur)*spectral_zucconi6(fract(2.*z+.2*tt+uv.x*.2))*luma;
}

void main()
{
    vec2 uv = (fragCoord - .5*iResolution.xy)/iResolution.y;

    vec3 col = vec3(0);
    vec4 tex = texture(iChannel0, fragCoord/iResolution.xy);
    if (tex.a != iResolution.x) tex = vec4(0);
    tt = iTime*.2;

    uv *= .9;

    float N = 12.0;
    float a = atan(uv.x, - uv.y) + .5*tt;
    a = mod(a+PI/N, TAU/N)- PI/N;
    
    // log scale
    float tz = log(tt/2.)*2.;
    uv = length(uv)*vec2(cos(a),sin(a))*tz;
    uv = abs(uv)-0.25;
    uv = abs(uv)-0.15;

    uv *= 30.0;

    float s = 1./COUNT;
    
    for(float i=0.; i<1.; i+=s) {   
        float z = fract(i-.1*tt);
        float fade = smoothstep(1., .9, z);
        vec2 UV = uv;
        col += spiral(UV*z, z)*fade;
    }
    
    col = pow(col, vec3(0.5));
    
    // before the breakthrough
    if(tt < 2.){
        col = 1.05-col;
        col = pow(col, vec3(2.2));
        col = clamp(col, vec3(0), vec3(1));
    }
    
    col = mix(col, tex.rgb, 0.7);
    
    fragColor = vec4(col, iResolution.x);
}
