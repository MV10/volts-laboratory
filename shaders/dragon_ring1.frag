#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input0

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    vec4 map = texture(iChannel0, uv);
    
    // dim (clean the seams)
    map.r -= 0.1;
    
    // blured normal
    #define T(u) textureLod(iChannel0, uv+u, 4.).r
    vec3 ep = vec3(10./iResolution.xy,0);
    vec3 normal = normalize(vec3(T(-ep.xz)-T(ep.xz), T(-ep.zy)-T(ep.zy), map.r));
    
    // lighting
    float light = dot(normal, normalize(vec3(0,1,1)))*.5+.5;
    vec3 color = vec3(light*light);
    
    // stencil
    color *= smoothstep(.0,.01,map.r);
    
    fragColor = vec4(color,1.0);
}
