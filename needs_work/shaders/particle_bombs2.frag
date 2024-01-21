#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input0
#define iChannel1 input1



//-----------------CONSTANTS MACROS-----------------

#define PI 3.14159265359

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

void main()
{
    vec2 uv = fragCoord.xy/iResolution.xy;
    vec4 sample1 = texture(iChannel0, uv);
    vec4 sample2 = texture(iChannel1, uv);
    
    float w = smoothstep(0.0, 1.0, 1.0-length(sample2.zw*2.0-1.0)/sqrt(2.0));
    
    fragColor.rgb = (sample1.rgb*(1.0-w)+
                     
                      (w));
}