#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iFrame frame
#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution

#define factor_numerator 19.
#define factor_denominator 20.

void main()
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 texel = 1. / iResolution.xy;
    
    float step_y = texel.y;
    vec2 s  = vec2(0.0, -step_y);
    vec2 n  = vec2(0.0, step_y);

    vec4 im_n =  texture(iChannel0, uv+n);
    vec4 im =    texture(iChannel0, uv);
    vec4 im_s =  texture(iChannel0, uv+s);
    
    // use luminance for sorting
    float len_n = dot(im_n, vec4(0.299, 0.587, 0.114, 0.));
    float len = dot(im, vec4(0.299, 0.587, 0.114, 0.));
    float len_s = dot(im_s, vec4(0.299, 0.587, 0.114, 0.));
    
    if(int(mod(float(iFrame) + fragCoord.y, 2.0)) == 0) {
        if ((len_s > len)) { 
            im = im_s;    
        }
    } else {
        if ((len_n < len)) { 
            im = im_n;    
        }   
    }
    
    // blend with image
    if(iFrame<1) {
        fragColor = texture(iChannel1, uv);
    } else {
        fragColor = (texture(iChannel1, uv) + im * factor_numerator ) / factor_denominator;
    }
}
