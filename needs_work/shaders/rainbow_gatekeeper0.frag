#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D inputA;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 inputA

// LICENSE:
// Creative Commons Attribution 4.0 International License.
// https://creativecommons.org/licenses/by/4.0/

#define T(x) texture(iChannel0, fract((x)/iResolution.xy))

void main()
{   
    fragColor = fragCoord.yyyx / 1e4;
    for(float t=.6; t<4e2; t+=t)
    	fragColor += fragColor.gbar / 4.-fragColor *.3 + T(fragCoord - fragColor.wz * t);
    
	fragColor = mix(T(fragCoord + fragColor.xy), cos(fragColor), .07);
}
