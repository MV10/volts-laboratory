#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input0
#define iChannel1 eyecandyShadertoy

void main()
{
    vec2 uv = fragCoord/iResolution.xy;

    vec2 offset_uv = (uv-0.5);
    uv-=length(offset_uv) * normalize(offset_uv)*texelFetch(iChannel1,ivec2((((atan(-abs(offset_uv.x),offset_uv.y)/(2.0*3.141592))+1.0)/1.0)*512.0,0),0).g;
    
    vec3 a = texture(iChannel0,uv).rgb;
    
    vec3 col = a;
    if(uv.y<0.0){
        col=1.0-col;
    }

    fragColor = vec4(col,1.0);
}
