#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime (time + randomrun * 300.0)
#define iChannel0 input1
#define iChannel1 input0

#define ROUGHNESS 0.25
#define DEPTH 100.0

#define LIGHT
#define SPEC

#define BUMPSTRENGTH 1000.0 * ROUGHNESS
#define LIGHTSTRENGTH 1.0
#define SPECULAR 0.92

#define SCALE 2.0

float getHeight(vec2 coord) 
{
    return dot(texture(iChannel0, mod(coord/iResolution.xy, 1.0)).rgb, vec3(.2126, .7152, .0722));
}

vec4 normal(vec2 coord) 
{
    float current = getHeight(coord);
    float x = (getHeight(coord + vec2(1.0, 0.0)) - current) * BUMPSTRENGTH;
    float y = (getHeight(coord + vec2(0.0, 1.0)) - current) * BUMPSTRENGTH;
    return vec4(normalize(vec3(x, y, 1.0)), current);
}

vec3 tint(vec3 color) 
{
    return mix(vec3(0.1, 0.3, 0.5), color, 75.0 / (DEPTH + 75.0));
}

vec3 shade(vec2 coord) 
{
    vec4 norm = normal(coord);
    
    #ifdef LIGHT
    
    vec3 lightNorm = normalize(vec3(0.1, -0.1, 1.0));
    
    float diff = dot(norm.xyz, lightNorm);
    
    vec2 refracNorm = (refract(vec3(0.0, 0.0, -1.0), norm.xyz, 0.35) * DEPTH).xy + coord.xy;
    vec2 nCoord = refracNorm / iResolution.xy;
    
    #ifdef SPEC
    
    float specang = acos(diff);
    float specexp = specang / (1.0-SPECULAR);
    float spec = exp(-specexp * specexp) * SPECULAR;
    
    #else
    
    float spec = 0.0;
    
    #endif /* SPEC */
    
    return (tint(texture(iChannel1, nCoord).rgb) + vec3(spec)) * LIGHTSTRENGTH;

    #else
    
    return norm.xyz;
    
    #endif /* LIGHT */
}

void main()
{
    fragColor = vec4(shade(fragCoord),1.0);
}
