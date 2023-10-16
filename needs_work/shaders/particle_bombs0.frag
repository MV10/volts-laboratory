#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
uniform sampler2D inputA;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputA
#define iChannel1 inputB
#define iChannel2 eyecandyShadertoy



//-----------------CONSTANTS MACROS-----------------

#define PI 3.14159265359
#define E 2.7182818284
#define GR 1.61803398875
#define MAX_DIM (max(iResolution.x,iResolution.y))

//-----------------UTILITY MACROS-----------------

// mcguirev10: renamed, and remove the silly __LINE__ macro
//#define time ((sin(float(__LINE__))/PI/GR/E+1.0/GR/PI/E)*iTime+1000.0)
#define time_calc ((sin(20.)/PI/GR/E+1.0/GR/PI/E)*time+1000.0)

#define sphereN(uv) (clamp(1.0-length(uv*2.0-1.0), 0.0, 1.0))
#define clip(x) (smoothstep(0.25, .75, x))
#define TIMES_DETAILED (1.0)
#define angle(uv) (atan(uv.y, uv.x))
#define angle_percent(uv) ((angle(uv)/PI+1.0)/2.0)
#define hash(p) (fract(sin(vec2( dot(p,vec2(127.5,313.7)),dot(p,vec2(239.5,185.3))))*43458.3453))

#define flux(x) (vec3(cos(x),cos(4.0*PI/3.0+x),cos(2.0*PI/3.0+x))*.5+.5)
#define rormal(x) (normalize(sin(vec3(time, time/GR, time*GR)+seedling)*.25+.5))
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

//-----------------SEEDLINGS-----------------------
float seedling = 0.0;
float stretch = 1.0;
vec2 offset = vec2(0.0);
float last_height = 0.0;
float scale = 1.0;
float extraTurns = 0.0;
float aspect = 1.0;
//-----------------TREES---------------------------
float distTree = 0.0;
float angleTree = 0.0;

//-----------------BASE IMAGE--------------------------

vec4 galaxy(vec2 uv)
{
    vec2 uv0 = uv;
    float r = length(uv);
	uv *= 5.0*(GR);
    
    
    float r1 = log(length(uv)+1.)*2.0;
    float r2 = pow(log(length(uv)+1.)*3.0, .5);
    
    float rotation = iTime*PI*2.0;
    
    float theta1 = atan(uv.y, uv.x)-r1*PI+rotation*.5+seedling;
    float theta2 = atan(uv.y, uv.x)-r2*PI+rotation*.5+seedling;
    
    vec4 color = vec4(flux((seedling*GR+1.0/GR)*time_calc*PI*4.0), 1.0);
    
    vec4 final = (acos(1.0-(cos(theta1)*cos(theta1)+sqrt(cos(theta1+PI)*cos(theta1+PI)))/2.0)*(1.0-log(r1+1.))
              + cos(1.0-(cos(theta2)*cos(theta2)+cos(theta2+PI/2.)*cos(theta2+PI/2.))/2.0)*(1.25-log(r2+1.)))*color;
         
    final.rgba += color;
    
    final /= r1;
    
	final = (clamp(final, 0.0, 1.0));
    
    float weight = clamp(length(clamp(final.rgb, 0.0, 1.0)), 0.0, 1.0);
    return final*smoothstep(0.0, 1.0/GR/PI/E, 1.0-r);
}

//-----------------IMAGINARY TRANSFORMATIONS-----------------

vec2 cmul(vec2 v1, vec2 v2) {
	return vec2(v1.x * v2.x - v1.y * v2.y, v1.y * v2.x + v1.x * v2.y);
}

vec2 cdiv(vec2 v1, vec2 v2) {
	return vec2(v1.x * v2.x + v1.y * v2.y, v1.y * v2.x - v1.x * v2.y) / dot(v2, v2);
}

vec2 mobius(vec2 uv, vec2 multa, vec2 offa, vec2 multb, vec2 offb)
{
    
    //numerator /= (abs(denominator)+1.0);
    
    vec2 quotient = vec2(0.0);
    const int bends = 4;
    for(int i = 0; i < bends; i++)
    {
       	float iteration = float(i)/float(bends);
        vec2 numerator = cmul(uv, multa+sin(vec2(time_calc+seedling-2.0*PI*sin(-iteration+time_calc/GR), time_calc/GR+seedling-2.0*PI*sin(iteration+time_calc)))) + offa
            +sin(vec2(time_calc+seedling-2.0*PI*sin(-iteration+time_calc/GR), time_calc/GR+seedling-2.0*PI*sin(iteration+time_calc)));
        vec2 denominator = cmul(uv, multb+sin(vec2(time_calc+seedling-2.0*PI*sin(-iteration+time_calc/GR), time_calc/GR+seedling-2.0*PI*sin(iteration+time_calc)))) + offb
            +sin(vec2(time_calc+seedling-2.0*PI*sin(-iteration+time_calc/GR), time_calc/GR+seedling-2.0*PI*sin(iteration+time_calc)));
        quotient += (cdiv(numerator, denominator));
        
        
    }
        
    float a = atan(quotient.y, quotient.x);
    
    angleTree = a/PI;
    distTree = length(quotient.xy);
    
    //quotient = rotatePoint(vec3(quotient, 0.0), vec3(0.0, 0.0, 1.0), a).xy;
    vec2 next = quotient;


    float denom = length(fwidth(uv));//max(fwidth(uv.x),fwidth(uv.y));
    denom += 1.0-abs(sign(denom));

    float numer = length(fwidth(next));//min(fwidth(next.x),fwidth(next.y));
    numer += 1.0-abs(sign(numer));

    
    
    stretch = denom/numer;
    
    return quotient;
}

//-----------------ITERATED FUNCTION SYSTEM-----------------

vec2 iterate(vec2 uv, vec2 dxdy, out float magnification, vec2 multa, vec2 offa, vec2 multb, vec2 offb)
{
    uv += offset;
    
    vec2 a = uv+vec2(0.0, 		0.0);
    vec2 b = uv+vec2(dxdy.x, 	0.0);
    vec2 c = uv+vec2(dxdy.x, 	dxdy.y);
    vec2 d = uv+vec2(0.0, 		dxdy.y);//((fragCoord.xy + vec2(0.0, 1.0)) / iResolution.xy * 2.0 - 1.0) * aspect;

    vec2 ma = mobius(a, multa, offa, multb, offb);
    vec2 mb = mobius(b, multa, offa, multb, offb);
    vec2 mc = mobius(c, multa, offa, multb, offb);
    vec2 md = mobius(d, multa, offa, multb, offb);
    
    float da = length(mb-ma);
    float db = length(mc-mb);
    float dc = length(md-mc);
    float dd = length(ma-md);
    
    magnification = stretch;
    
    vec2 final = mobius(uv, multa, offa, multb, offb);
    
    seedling = (floor(final.x)+floor(final.y));
    
    return final;
}
    
const int numWeights = 32;

vec3 weights[numWeights];

float lowAverage()
{
    const int iters = numWeights;
    float product = 1.0;
    float sum = 0.0;
    
    float smallest = 0.0;
    
    for(int i = 0; i < iters; i++)
    {
        float sound = texture(iChannel2, vec2(float(i)/float(iters), 0.5)).g;
        smallest = 
        
        product *= sound;
        sum += sound;
        
        weights[i].r = sound;
    }
    for(int i = 0; i < iters; i++)
        weights[i].gb = vec2(sum/float(iters), pow(product, 1.0/float(iters)));
    return max(sum/float(iters), pow(product, 1.0/float(iters)));
}
vec4 stars(vec2 uv)
{
    float density = 2.0;
    uv *= density;
    float s = floor(uv.x)*1234.1234+floor(uv.y)*123.123;
    vec2 p = floor(uv)+saw(floor(uv)+iTime+s)*.5+.25;
    
    float l = length(p-uv);
    float f = smoothstep(.1*GR, 1.0, exp(-l*8.0));
    
    return vec4(clamp(flux(time_calc+f+s)*f+f*f*f, 0.0, 1.0), f);
}

void main()
{
    float height = max(lowAverage(), last_height)-1.0/30.0;
    float beat = clip(height);

    last_height = height;
    vec2 uv = fragCoord.xy / iResolution.xy;
    float scale = PI*2.0;//+sin(time_calc*PI*PI+beat*PI));
    uv = uv*scale-scale/2.0;
    float aspect = iResolution.x/iResolution.y;
    
    uv.x *= aspect;
    
    vec2 uv0 = uv;
    
	const int max_iterations = 4;
    int target = max_iterations;//-int(saw(spounge)*float(max_iterations)/2.0);
    vec2 multa, multb, offa, offb;
    
    float antispeckle = 1.0; 
    float magnification = 1.0;
  
	vec4 color = vec4(0.0);
    float center = 1.0E32;
    float angle = atan(uv.y, uv.x)/PI;
    float border = 1.0;
    
    seedling = 0.0;
    
        
    offset = sin(vec2(time_calc+seedling,
                      -time_calc-seedling))*(.5/E);
    
    border *= (1.0-color.a);//*antispeckle;
    
    
    for(int i = 0; i < max_iterations; i++)
    {
        float iteration = float(i)/float(max_iterations);

        multa = cos(vec2(time_calc*1.1, time_calc*1.2)+iteration*PI*4.0)*.5+1.0;
        offa = cos(vec2(time_calc*1.3, time_calc*1.4)+iteration*PI*4.0)*2.0;
        multb = cos(vec2(time_calc*1.5, time_calc*1.6)+iteration*PI*4.0)*.5+1.0;
        offb = cos(vec2(time_calc*1.7, time_calc*1.8)+iteration*PI*4.0)*2.0;

        seedling = float(i);
        extraTurns = float(i*i+1);

        uv = iterate(uv, .5/iResolution.xy, magnification, multa, offa, multb, offb);
        antispeckle *= stretch;

        float weight = pow(antispeckle, 1.0/float(i+1));
        
        border *= clamp(1.0-color.a, 0.0, 1.0);//*antispeckle;

        float skip = saw(floor(uv.x+uv.y)*PI*123.0);

        vec3 p = vec3(saw(uv*PI), sphereN(saw(uv*PI)));
        
        center = min(min(center, distTree), weight);
        
        angle = (angle*angleTree);
        
        color += (galaxy((p.xy)*2.0-1.0)+stars(p.xy))*pow(border, 1.0/float(i+1))*weight;//+stars(p.xy)*draw, 0.0, 1.0);

    }
    float weight = color.a*pow(antispeckle, 1.0/float(max_iterations));
    
    vec4 sample1 = texture(iChannel0, fragCoord.xy / iResolution.xy);
    
    fragColor = clip(beat*E+.125)*clamp(vec4((color))*weight+(1.0-weight)*sample1, 0.0, 1.0);
}
