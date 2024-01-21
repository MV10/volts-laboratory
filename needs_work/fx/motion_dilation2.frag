#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D inputB;
uniform sampler2D inputC;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel0 input0
#define iChannel1 inputB
#define iChannel2 inputC
#define iResolution resolution

//Apply UV Offset
#define F vec3(-1., 1., -1.)

void main()
{
    vec2 uv = fragCoord / iResolution.xy;
    vec2 uvoffset = texture(iChannel1,uv).xy; 
    uvoffset = normalize(uvoffset) * sin(iTime*1.);

    vec3 outcol = mix( texture(iChannel0,uv + uvoffset * 0.005),  texture(iChannel2,uv + uvoffset * 0.0025), 0.8).rgb;
    float alpha =1.-pow( clamp(  dot(texture(iChannel0,uv + uvoffset * 0.005).xyz, F) , 0.,1.), 0.5); 
    fragColor = vec4(outcol, alpha);
}