#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0
#define iChannel1 inputB

//-----------------CONSTANTS MACROS-----------------

#define PI 3.14159265359
#define E 2.7182818284
#define GR 1.61803398875
#define MAX_DIM (max(iResolution.x,iResolution.y))

//-----------------UTILITY MACROS-----------------

// mcguirev10: replaced the god-awful __LINE__ nonsense with random value 20; see: https://www.shadertoy.com/view/ttf3R4
#define itime ((sin(20.0)/PI/GR+.5)*iTime+1000.0)
#define sphereN(uv) (clamp(1.0-length(uv*2.0-1.0), 0.0, 1.0))
#define clip(x) (smoothstep(0.25, .75, x))
#define TIMES_DETAILED (1.0)
#define angle(uv) (atan(uv.y, uv.x))
#define angle_percent(uv) ((angle(uv)/PI+1.0)/2.0)
#define hash(p) (fract(sin(vec2( dot(p,vec2(127.5,313.7)),dot(p,vec2(239.5,185.3))))*43458.3453))

#define flux(x) (vec3(cos(x),cos(4.0*PI/3.0+x),cos(2.0*PI/3.0+x))*.5+.5)
#define rormal(x) (normalize(sin(vec3(itime, itime/GR, itime*GR)+seedling)*.25+.5))
#define rotatePoint(p,n,theta) (p*cos(theta)+cross(n,p)*sin(theta)+n*dot(p,n) *(1.0-cos(theta)))

float saw(float x)
{
    x/= PI;
    float f = mod(floor(abs(x)), 2.0);
    float m = mod(abs(x), 1.0);
    return f*(1.0-m)+(1.0-f)*m;
}
vec2 saw(vec2 x)
{
    return vec2(saw(x.x), saw(x.y));
}

vec3 saw(vec3 x)
{
    return vec3(saw(x.x), saw(x.y), saw(x.z));
}
vec4 saw(vec4 x)
{
    return vec4(saw(x.x), saw(x.y), saw(x.z), saw(x.w));
}

vec2 cmul(vec2 v1, vec2 v2) {
	return vec2(v1.x * v2.x - v1.y * v2.y, v1.y * v2.x + v1.x * v2.y);
}

vec2 cdiv(vec2 v1, vec2 v2) {
	return vec2(v1.x * v2.x + v1.y * v2.y, v1.y * v2.x - v1.x * v2.y) / dot(v2, v2);
}

float lowAverage()
{
    const int iters = 32;
    float product = 1.0;
    float sum = 0.0;
    
    float smallest = 0.0;
    
    for(int i = 0; i < iters; i++)
    {
        float sound = texture(iChannel1, vec2(float(i)/float(iters), 0.5)).r;
        smallest = 
        
        product *= sound;
        sum += sound;
    }
    return max(sum/float(iters), pow(product, 1.0/float(iters)));
}
vec2 mobius(vec2 uv)
{
    
    //numerator /= (abs(denominator)+1.0);
    
    vec2 quotient = vec2(0.0);
    const int bends = 16;
    for(int i = 0; i < bends; i++)
    {
       	float iteration = float(i)/float(bends);
        vec2 numerator = uv;
        vec2 denominator =rotatePoint(vec3(cmul(uv, sin(vec2(itime-2.0*PI*sin(-iteration+itime/GR), itime/GR-2.0*PI*sin(iteration+itime)))), 0.0), vec3(0.0, 0.0, 1.0), itime*PI).xy
            +vec2(cos(iteration*16.0*PI+sin(itime*PI)), sin(iteration*16.0*PI+sin(itime*PI)))*iteration*2.0;
        vec2 final = (cdiv(numerator, denominator));
        quotient += final/float(bends);
        
        
    }
        
    float a = atan(quotient.y, quotient.x);
    
    
    //quotient = rotatePoint(vec3(quotient, 0.0), vec3(0.0, 0.0, 1.0), a).xy;
    vec2 next = quotient;


    float denom = length(fwidth(uv));//max(fwidth(uv.x),fwidth(uv.y));
    denom += 1.0-abs(sign(denom));

    float numer = length(fwidth(next));//min(fwidth(next.x),fwidth(next.y));
    numer += 1.0-abs(sign(numer));

    
    
    return quotient;
}


vec4 stars(vec2 uv)
{
    uv = ((mobius(uv)));
    
    float density = 24.0;
    uv *= density;
    float s = floor(uv.x)*1234.1234+floor(uv.y)*123.123;
    vec2 p = floor(uv)+saw(floor(uv)+iTime+s)*.5+.25;
    
    float l = length(p-uv);
    float f = smoothstep(.1*GR, 1.0, exp(-l*8.0));
    
    return vec4(clamp(flux(f+s)*f+f*f*f, 0.0, 1.0), f);
}

//-----------------RENDER-----------------

vec2 spiral(vec2 uv)
{
    float turns = 2.0;//+saw(itime*1.1234)*4.0;
    float r = pow(log(length(uv)+1.), 1.175);
    float theta = atan(uv.y, uv.x)*turns-r*PI;
    return vec2(saw(r*PI+iTime), saw(theta));
}

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    vec4 sample0 = texture(iChannel0, uv);
    
    vec2 uv0 = uv;
    float scale = 2.0*PI;
    
    float variety = saw(itime);
    
    float recursion1 = clamp(saw(itime+variety)*3.0-2.0, 0.0, 1.0);
    float recursion2 = clamp(saw(itime+variety)*3.0-2.0, 0.0, 1.0);
    
    
    uv = recursion1+(1.0-recursion1)*(uv*2.0-1.0)
        	*(1.0-recursion2)+recursion2*(saw(uv*PI*(5.0+sin(itime)*5.0))*2.0-1.0);
    
    vec2 direction = uv*iResolution.xy/30.0;
    float l = length(uv*2.0-1.0);
    vec4 sample1 = texture(iChannel1, uv0+(uv)/256.0);
    
    sample1 += stars(uv0)*(1.0-clip(sample1.a))*clip(sample0.a*PI);
    
    fragColor = clamp((sample1)*(1.0-sample0.a)+sample0-1.0/60.0, 0.0, 1.0);
}
