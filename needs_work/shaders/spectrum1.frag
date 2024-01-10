#version 460
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

// Phoenix - @P_Malin
// https://www.shadertoy.com/view/4tKBRm
// An audio channel thing
// Just random messing with feedback. Warning, this might make you fall over.

vec4 SampleCol( vec2 vUV )
{
    vec4 vSample = textureLod( iChannel0, vUV, 0.0 );
    
    vec3 vCol = normalize( 0.5 + 0.49 * -cos( vec3(0.1, 0.4, 0.9) * vSample.g + iTime * 2.0));
    
    float shade = vSample.r;
    vSample.rgb = vCol * shade;
    
    return vSample;
}

void main()
{
    vec2 vUV = fragCoord / iResolution.xy;
    
    // comment out to remove symmetry
    vUV.y = abs( vUV.y * 2.0 - 1.0);    
    vUV.x = abs( vUV.x * 2.0 - 1.0);
    
    vUV.x = pow( vUV.x, 0.7 );
    //vUV.y = pow( vUV.y, 0.5 );
    
     //vUV.xy =  vUV.yx;
    
    fragColor = SampleCol( vUV );
    
	//fragColor -= SampleCol( vUV - vec2(0.0, 0.05) ) * 0.5;
    
    
    //fragColor.rgb = pow( fragColor.rgb, vec3(1.0f / 1.8 ) );
}