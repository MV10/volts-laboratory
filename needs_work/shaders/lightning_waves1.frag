#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input0

vec2 gradient(vec2 uv) {
    
    vec2 pxuv = vec2(1.,1.) / iResolution.xy;
    
    float c = texture(iChannel0, uv).x;
    float r = texture(iChannel0, uv+vec2(pxuv.x, 0.0)).x;
    float u = texture(iChannel0, uv+vec2(0.0, pxuv.y)).x;
    
    vec2 grd = vec2(0.0, 0.0);
    
    grd.x = r-c;
    grd.y = u-c;
    
    grd = normalize(grd);
    
    return grd;
}

void main()
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 grd = gradient(uv)*0.5+0.5;
    fragColor = vec4(grd, 1.0, 1.0);
}
