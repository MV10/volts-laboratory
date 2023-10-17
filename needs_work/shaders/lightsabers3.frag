#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input1

// Homecomputer by nimitz 2016 (twitter: @stormoid)
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options

//Code is in the other tabs:
//Buf A = Velocity and position handling
//Buf B = Rendering
//Buf C = Soundcloud filtering and propagation

void main()
{
    vec2 q = fragCoord.xy / iResolution.xy;
	vec3 col = texture(iChannel0, q).rgb;
    
    // mcguirev10: scanlines just look like noise from across the room
    //col *= sin(gl_FragCoord.y*350.+time)*0.04+1.;//Scanlines
    //col *= sin(gl_FragCoord.x*350.+time)*0.04+1.;
    
    col *= pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1)*0.35+0.65; //Vign
	fragColor = vec4(col,1.0);
}