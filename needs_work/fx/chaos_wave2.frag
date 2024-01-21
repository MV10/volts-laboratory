#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input1
#define iChannel1 input0

// Fork of "Wave Propagation Effect" by tomkh. https://shadertoy.com/view/Xsd3DB
// 2018-11-22 10:37:40

void main()
{
    vec2 q = fragCoord.xy/iResolution.xy;

    vec3 e = vec3(vec2(1.)/iResolution.xy,0.);
    float f = 10.0;
    float p10 = texture(iChannel0, q-e.zy).z;
    float p01 = texture(iChannel0, q-e.xz).z;
    float p21 = texture(iChannel0, q+e.xz).z;
    float p12 = texture(iChannel0, q+e.zy).z;
    
    vec4 w = texture(iChannel0, q);
    
    // Totally fake displacement and shading:
    vec3 grad = normalize(vec3(p21 - p01, p12 - p10, 0.5));

    //vec2 uv = fragCoord.xy*2./iChannelResolution[1].xy + grad.xy*.35;
    vec2 uv = fragCoord.xy*2./vec2(textureSize(iChannel1,0)) + grad.xy*.35;

    uv = uv * 0.5;
    vec4 c = texture(iChannel1, uv);
    c += c * 0.5;
    c += c * w * (0.5 - distance(q, vec2(0.5)));
    vec3 lightDir = vec3(0.2, -0.5, 0.7);
    vec3 light = normalize(lightDir);
    
    float diffuse = dot(grad, light);
    float spec = pow(max(0.,-reflect(light,grad).z),32.);
    fragColor = mix(c,vec4(.7,.8,1.,1.),.25)*max(diffuse,0.) + spec;
    
    // mcguirev10 - debug first FX pass
    //fragColor = texture(iChannel0, q);
}