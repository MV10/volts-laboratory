#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0; // here for debug only
uniform sampler2D input1;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input1
#define iChannel2 eyecandyShadertoy

float divergence(vec2 uv) {

    vec2 tx = 1. / iResolution.xy;

    vec4 uv_n =  (texture(iChannel0, uv + vec2(0.0, tx.y))-0.5)*2.0;
    vec4 uv_e =  (texture(iChannel0, uv + vec2(tx.x, 0.0))-0.5)*2.0;
    vec4 uv_s =  (texture(iChannel0, uv + vec2(0.0, -tx.y))-0.5)*2.0;
    vec4 uv_w =  (texture(iChannel0, uv + vec2(-tx.x, 0.0))-0.5)*2.0;

   	float div = uv_s.y - uv_n.y - uv_e.x + uv_w.x;

    return div;
}

void main()
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    
    float beat = texture(iChannel2, vec2(0.07, 0.5)).g;

    float v = divergence(uv);// * 2.5 * (beat + 1.0);
    
    vec3 col = (0.5 + 0.5*cos(6.*v*uv.xyx+vec3(0,2,4)));
    
    fragColor = vec4(vec3(v)*col, 1.0);
    
    if (fragCoord.x+2. >= iResolution.x || fragCoord.y+2. >= iResolution.y) {
        fragColor = vec4(vec3(0.0), 1.0);
    }
    
    // debug
    //fragColor = texture(input0, uv);
    //fragColor = texture(input1, uv);
}