#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel1 eyecandyShadertoy

//-----------------CONSTANTS MACROS-----------------

#define PI 3.14159265359
#define E 2.7182818284
#define GR 1.61803398875
#define MAX_DIM (max(iResolution.x,iResolution.y))

//-----------------UTILITY MACROS-----------------

// mcguirev10: replaced the god-awful __LINE__ nonsense with random value 20; see: https://www.shadertoy.com/view/ttf3R4
#define itime ((sin(20.0)/PI/GR/E/PI+1.0/PI/GR/E/PI)*iTime+1000.0)
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

//-----------------SEEDLINGS-----------------------
float seedling = 0.0;
float stretch = 1.0;
vec2 offset = vec2(0.0);
vec2 last_uv = vec2(0.0);
float last_height = 0.0;
float scale = 1.0;
float extraTurns = 0.0;
float aspect = 1.0;
//-----------------TREES---------------------------
float distTree = 0.0;
float angleTree = 0.0;

//-----------------BASE IMAGE--------------------------

vec4 stars(vec2 uv)
{
    float density = 2.0;
    uv *= density;
    float s = floor(uv.x)*1234.1234+floor(uv.y)*123.123;
    vec2 p = floor(uv)+saw(floor(uv)+iTime+s)*.5+.25;
    
    float l = length(p-uv);
    float f = smoothstep(.1*GR, 1.0, exp(-l*8.0));
    
   	vec3 c = flux(f+s+seedling+ (last_uv.x+last_uv.y)/2.0/PI);
    
    return vec4(clamp(c*f+f*f*f*f, 0.0, 1.0), (saw(f*2.0*PI)));
}

vec4 galaxy(vec2 uv)
{
    uv = rotatePoint(vec3(uv, 0.0), vec3(0.0, 0.0, 1.0), itime*(saw(seedling)+1.0)*PI*4.0).xy;;
    vec2 uv0 = uv;
    float r = length(uv);
	uv *= 5.0*(GR);
    
    
    float r1 =  pow(log(length(uv)+1.), 2.0);
    float r2 = pow(log(length(uv)+1.), 1.5);
    
    float rotation = itime;
    
    float theta1 = atan(uv.y, uv.x)-r1*PI+rotation*.5+seedling;
    float theta2 = atan(uv.y, uv.x)-r2*PI+rotation*.5+seedling;
    
    float plant = (seedling*GR+1.0/GR)*4.0*PI;
    
    
    float arms = acos(1.0-(cos(theta1)*cos(theta1)+sqrt(cos(theta1+PI)*cos(theta1+PI)))/2.0)
              + cos(1.0-(cos(theta2)*cos(theta2)+cos(theta2+PI/2.)*cos(theta2+PI/2.))/2.0);
    
    plant = plant*PI+arms+ 
                           atan(last_uv.x,last_uv.y)
                           ;
    
    vec4 color = vec4(flux(plant)+
                      (1.0-smoothstep(0.0, 1.0/5.0, saw(plant-itime))), 1.0)*arms
        *(1.0-smoothstep(4.0/5.0, 1.0, saw(plant-itime)));
    
    color += stars(uv)*arms;
    vec4 final = clamp(color/2.0, 0.0, 1.0);
         
    final /= r1;
    
	final = (clamp(final, 0.0, 1.0));
    
    
    float weight = clamp(length(clamp(final.rgb, 0.0, 1.0)), 0.0, 1.0);
    return clamp(final*smoothstep(0.0, 1.0/GR/PI/E, 1.0-r), 0.0, 1.0);
}

//-----------------IMAGINARY TRANSFORMATIONS-----------------

vec2 cmul(vec2 v1, vec2 v2) {
	return vec2(v1.x * v2.x - v1.y * v2.y, v1.y * v2.x + v1.x * v2.y);
}

vec2 cdiv(vec2 v1, vec2 v2) {
	return vec2(v1.x * v2.x + v1.y * v2.y, v1.y * v2.x - v1.x * v2.y) / dot(v2, v2);
}

vec2 mobius(vec2 uv)
{
    
    //numerator /= (abs(denominator)+1.0);
    
    vec2 quotient = vec2(0.0);
    const int bends = 4;
    for(int i = 0; i < bends; i++)
    {
       	float iteration = float(i)/float(bends);
        vec2 numerator = uv;
        vec2 denominator =rotatePoint(vec3(cmul(uv, sin(vec2(itime+
                                                             seedling-2.0*PI*sin(-iteration+
                                                                                 itime/GR), 
                                                             itime/GR+seedling-2.0*PI*sin(iteration+
                                                                                         itime)))), 0.0), vec3(0.0, 0.0, 1.0), 
                                      itime*PI).xy
            +vec2(cos(iteration*16.0*PI-(itime*
                                         PI+seedling)*PI*2.0), sin(iteration*16.0*PI-(itime*
                                                                                      PI+seedling)*PI*2.0))*(iteration+last_height*PI)*2.0;
        vec2 final = (cdiv(numerator, denominator));
        quotient += final/(float(bends))*(GR+sin(itime+seedling+iteration));
        
        
    }
    for(int i = 0; i < bends; i++)
    {
       	float iteration = float(i)/float(bends);
        vec2 numerator = uv;
        vec2 denominator =rotatePoint(vec3(cmul(uv, sin(vec2(itime+
                                                             seedling-2.0*PI*sin(-iteration+
                                                                                 itime/GR), 
                                                             itime/GR+seedling-2.0*PI*sin(iteration+
                                                                                         itime)))), 0.0), vec3(0.0, 0.0, 1.0), 
                                      itime*PI).xy
            +vec2(cos(iteration*16.0*PI-(itime*
                                         PI+seedling)*PI*2.0), sin(iteration*16.0*PI-(itime*
                                                                                      PI+seedling)*PI*2.0))*PI;
        vec2 final = (cdiv(numerator, denominator));
        quotient += final/(float(bends))*(GR+sin(itime+seedling+iteration));
        
        
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

vec2 iterate(vec2 uv)
{
    uv += offset;
    
    
    vec2 final = mobius(uv);
    
    seedling = (floor(final.x)+floor(final.y));
    
    return final;
}
    
vec3 weights[32];


float lowAverage()
{
    const int iters = 512;
    float product = 1.0;
    float sum = 0.0;
    
    float smallest = 0.0;
    
    for(int i = 0; i < iters; i++)
    {
        float sound = texture(iChannel1, vec2(float(i)/float(iters), 0.75)).g;
        
        product *= sound;
        sum += sound;
    }
    return sum/float(iters);//max(sum/float(iters), pow(product, 1.0/float(iters)));
}

void main()
{
    float height = max(lowAverage(), last_height)-1.0/30.0;
    float beat = clip(height);

    last_height = height;
    vec2 uv = fragCoord.xy / iResolution.xy;
    float scale = PI*E;
    uv = uv*scale-scale/2.0;
    
    float aspect = iResolution.x/iResolution.y;
    
    uv.x *= aspect;
    
    vec2 uv0 = uv;
    
	const int max_iterations = 8;
    int target = max_iterations;//-int(saw(spounge)*float(max_iterations)/2.0);
    
    float antispeckle = 1.0; 
    float magnification = 1.0;
  
	vec4 color = vec4(0.0);
    float center = 1.0E32;
    float angle = atan(uv.y, uv.x)/PI;
    float border = 1.0;
    
    seedling = height*2.0*PI;
    
        
    offset = sin(vec2(itime+seedling,
                      -itime-seedling))*(.5/E);
    
    border *= (1.0-color.a);//*antispeckle;
    
    for(int i = 0; i < max_iterations; i++)
        weights[i] = vec3(vec2(0.0), 1.0);
    
    for(int i = 0; i < max_iterations; i++)
    {
        float iteration = float(i)/float(max_iterations);

        seedling = float(i);
        extraTurns = float(i*i+1);

        last_uv = rotatePoint(vec3(uv, 0.0), vec3(0.0, 0.0, 1.0), itime*(1.0+iteration)).xy;
        uv = iterate(uv);
        
        antispeckle *= clamp(1.0/length(fwidth(uv)), 0.0, 1.0);

        float weight = smoothstep(0.0, 1.0, pow(antispeckle, 1.0/float(i+1)));
        
        weights[i] = vec3(uv*2.0-1.0, weight);

        float draw = border*(1.0-color.a);

        float skip = saw(floor(uv.x+uv.y)*PI*123.0);

        vec3 p = vec3(saw(uv*PI), sphereN(saw(uv*PI)));
        
        center = min(center, distTree);
        
        angle = (angle*angleTree);
        
        color += (clip (texture(iChannel1, vec2(saw(-iTime), .25)).g+.125)*galaxy((p.xy)*2.0-1.0)+
                  clip (texture(iChannel1, vec2(saw(iTime), .25)).g+.25)*stars(p.xy))*draw*weight;//+stars(p.xy)*draw, 0.0, 1.0);
        border *= draw;//*antispeckle;
        uv = uv*weight + uv0*(1.0-weight);

    }
    float core = (1.0-smoothstep(0.0, 1.0/PI/GR/E, antispeckle));
    antispeckle = pow(antispeckle, 1.0/float(max_iterations));
    float v = smoothstep(0.0, 1.0/PI/GR/E, core*antispeckle);
    fragColor = clip(beat*PI+.25)*(vec4((color))*(1.0-v)+v*vec4(flux(seedling), 1.0));
}
