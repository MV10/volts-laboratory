#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 eyecandyShadertoy
#define iTime time

void main()
{
    //float fft1=texture(iChannel0,vec2(0.0/11025.0,0.8)).g;    
    //float fft2=texture(iChannel0,vec2(0.0/11025.0,0.25)).g;   
    float fft3=texture(iChannel0,vec2(0.0/11025.0,0.5)).g;   
    
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xx*12.0;

    // Time varying pixel color
    vec3 col = 0.5+0.5*sin(iTime+uv.x+vec3(0,0.7,4.0));
    col *= 0.5+0.5*cos(-iTime+uv.yyy+vec3(0,2.0,0.2));
	col *= 5.0-abs(tan(-iTime*fft3+uv.xxy+vec3(0.4,1.0,0.5)));

    // Output to screen
    fragColor = vec4(col,1.0);
}