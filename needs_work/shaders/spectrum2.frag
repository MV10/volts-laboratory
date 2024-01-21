#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input1

// Phoenix - @P_Malin
// https://www.shadertoy.com/view/4tKBRm
// An audio channel thing
// Just random messing with feedback. Warning, this might make you fall over.

void main()
{
    vec2 vUV = fragCoord / iResolution.xy;
    
    fragColor = vec4(0.0);

    fragColor += textureLod( iChannel0, vUV, 0.0 ) * 1.0;    
    fragColor += textureLod( iChannel0, vUV, 2.0 ) * 0.5;    
    fragColor += textureLod( iChannel0, vUV, 4.0 ) * 0.25;    
    fragColor += textureLod( iChannel0, vUV, 5.0 ) * 0.125;    
    
    fragColor.rgb = ( 1.0 - exp2( fragColor.rgb * -1000.0) );    
}
