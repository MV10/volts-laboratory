#version 460
precision highp float;

in vec2 fragCoord;
//uniform float randomrun;
uniform vec2 resolution;
uniform float time;
uniform sampler2D noisetexture;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

float smoothing = 0.1;
float ballradius = 0.01; //0.0;
float metaPow = 1.0;
float densityMin = 4.0;
float densityMax= 7.0;
float densityEvolution = 0.4;
float rotationSpeed = 0.005;
vec2 moveSpeed = vec2(0.1,0.0);
float distortion = 0.05;
float nstrength = 1.0;
float nsize = 1.0;
vec3 lightColor = vec3(7.0,8.0,10.0);



float saturate1(float x)
{
    return clamp(x, 0.0, 1.0);
}

vec2 rotuv(vec2 uv, float angle, vec2 center)
{    
   	return mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * (uv - center) + center;
}

float hash(float n)
{
    // mcguirev10 monkey-hi-hat note:
    // This pseudo-random generator doesn't work correctly on all GPUs / drivers.
    // See "GPUs Are Not Identical" on the monkey-hi-hat wiki "Creating Visualizations" page.
    // See also my fork of the original here: https://www.shadertoy.com/view/mdcfzX
    //return fract(sin(dot(vec2(n,n) ,vec2(12.9898,78.233))) * 43758.5453);  
    return texture(noisetexture, vec2(n)).r;
}

float metaBall(vec2 uv)
{
	return length(fract(uv) - vec2(0.5));
}

float metaNoiseRaw(vec2 uv, float density)
{
    float v = 0.99;
    float r0 = hash(2015.3548);
    float s0 = iTime*(r0-0.5)*rotationSpeed;
    vec2 f0 = iTime*moveSpeed*r0;
    vec2 c0 = vec2(hash(31.2), hash(90.2)) + s0;   
    vec2 uv0 = rotuv(uv*(1.0+r0*v), r0*360.0 + s0, c0) + f0;    
    float metaball0 = saturate1(metaBall(uv0)*density);
    
    for(int i = 0; i < 25; i++)
    {
        float inc = float(i) + 1.0;
    	float r1 = hash(2015.3548*inc);
        float s1 = iTime*(r1-0.5)*rotationSpeed;
        vec2 f1 = iTime*moveSpeed*r1;
    	vec2 c1 = vec2(hash(31.2*inc), hash(90.2*inc))*100.0 + s1;   
    	vec2 uv1 = rotuv(uv*(1.0+r1*v), r1*360.0 + s1, c1) + f1 - metaball0*distortion;    
    	float metaball1 = saturate1(metaBall(uv1)*density);
        
        metaball0 *= metaball1;
    }
    
    return pow(metaball0, metaPow);
}

float metaNoise(vec2 uv)
{ 
    float density = mix(densityMin,densityMax,sin(iTime*densityEvolution)*0.5+0.5);
    return 1.0 - smoothstep(ballradius, ballradius+smoothing, metaNoiseRaw(uv, density));
}

vec4 calculateNormals(vec2 uv, float s)
{
    float offsetX = nsize*s/iResolution.x;
    float offsetY = nsize*s/iResolution.y;
	vec2 ovX = vec2(0.0, offsetX);
	vec2 ovY = vec2(0.0, offsetY);
    
	float X = (metaNoise(uv - ovX.yx) - metaNoise(uv + ovX.yx)) * nstrength;
    float Y = (metaNoise(uv - ovY.xy) - metaNoise(uv + ovY.xy)) * nstrength;
    float Z = sqrt(1.0 - saturate1(dot(vec2(X,Y), vec2(X,Y))));
    
    float c = abs(X+Y);
	return normalize(vec4(X,Y,Z,c));
}

void main()
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    
    vec2 uv2 = uv;
    uv2.x *= iResolution.x/iResolution.y;
    uv2 *= vec2(1.0,0.75);
    uv2.y += sin(uv.x*0.5);
    uv2 += iTime*moveSpeed;

    vec2 sphereUvs = uv - vec2(0.5);
    float vign = length(sphereUvs);
    sphereUvs = (sphereUvs / (1.0 + vign))*1.5;
    
    float noise = metaNoise(uv2);
    
    vec4 n = calculateNormals(uv2, smoothstep(0.0, 0.5, 1.0 - vign));
    vec3 lDir = normalize(vec3(1.0,1.0,0.0));
    float l = max(0.0, dot(n.xyz, lDir));
      
    //vec4 tex = texture(iChannel0, sphereUvs + n.xy + iTime*moveSpeed*-0.2).rgba * 0.75;
    vec4 tex = texture(iChannel0, uv + n.xy);
    tex *= 1.0 - vign;
    
    vec3 col = mix(tex.xyz*0.75, tex.xyz+l*lightColor, noise);
    
	fragColor = vec4(n.w*col*5.0 + col, 1.0);
}