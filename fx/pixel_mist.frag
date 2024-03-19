#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iFrame int(frame)
#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution

void main()
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 texel = 1. / iResolution.xy;
    
    vec2 s;
    vec2 n;
    float coord;

    // mcguirev10 - mix it up a little
    float changeRate = 3.0 + (5.0 * randomrun);

    float dir = mod(iTime, changeRate);

    if (dir < changeRate * 0.5)
    {
        s  = vec2(-texel.x,0.0);
        n  = vec2(texel.x,0.0);
        coord = fragCoord.x;
    }
    else
    {
        s  = vec2(0.0,-texel.y);
        n  = vec2(0.0,texel.y);
        coord = fragCoord.y;
    }

    vec4 im_n = texture(iChannel0, uv+n);
    vec4 im =   texture(iChannel0, uv);
    vec4 im_s = texture(iChannel0, uv+s);
    
    float len_n = im_n.b;
    float len   = im.b;
    float len_s = im_s.b;

    dir = mod(iTime, changeRate * 3.5);
    
    if (dir < changeRate)
    {
        len_n = im_n.r;
        len   = im.r;
        len_s = im_s.r;
    }
    else if (dir< changeRate * 2.0)
    {
        len_n = im_n.g;
        len   = im.g;
        len_s = im_s.g;
    }
    
    if(int(mod(float(iFrame) + coord, 2.0)) == 0) 
    {
        if ((len_s > len)) im = im_s;    
    } 
    else 
    {
        if ((len_n < len)) im = im_n;    
    }

    // mcguirev10 - mix a tiny bit of the primary shader
    vec4 c = texture(iChannel1, uv);
    if(iFrame < 10) 
    {
        fragColor = c;
    } 
    else if(mod(iTime, 30.0) < 0.00001)
    {
        fragColor = mix(im, c, 0.25);
    }
    else
    {
        fragColor = mix(im, c, 0.01);
    }
}