#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

void main()
{   
    vec2 uv = (fragCoord - 0.5*iResolution.xy)/iResolution.y;
    fragColor = texture(iChannel0, fragCoord/iResolution.xy);
    fragColor = (sin(fragColor*5. + vec4(-3.4,0.1,-0.2,0.4) + sin(iTime)*0.1));
    fragColor = smoothstep(0.,0.7,fragColor );
    
    fragColor *= 1. - dot(uv,uv)*0.7;
    fragColor = max(fragColor, 0.);
    fragColor = pow(fragColor, vec4(0.45454));
}