#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

// Space Gif by Martijn Steinrucken aka BigWings - 2019
// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Original idea from:
// https://boingboing.net/2018/12/20/bend-your-spacetime-continuum.html
//
// To see how this was done, check out this tutorial:
// https://youtu.be/cQXAbndD5CQ

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
void main()
{
    // Get UV coordinates
    vec2 uv = (fragCoord.xy-iResolution.xy*.5)/iResolution.y;
    
    // Apply scaling factor based on audio input
    float audio = texture(eyecandyShadertoy, vec2(iTime * 0.5, 0.5)).g * 2.0;
    uv *= audio * 15.0 + 15.0;
    
    // Apply rotation based on audio input
    float rotSpeed = mix(0.0, 0.25, audio);
    float rotDir = mix(-1.0, 1.0, audio);
    float a = iTime * rotSpeed * rotDir;
    float s = sin(a);
    float c = cos(a);
    uv *= mat2(c, -s, s, c);

    // Apply psychedelic rainbow color gradient
    float m = .01;
    float t;
    for(float y=-1.0; y<=1.0; y++) {
        for(float x=-1.0; x<=1.0; x++) {
            vec2 offs = vec2(x, y);
            
            t = -iTime+length(uv-offs)*.2;
            float r = mix(0.0, 1.5, sin(t)*0.5+0.5);
            float c = smoothstep(r, r*0.9, length(fract(uv-offs)-0.5));
            m = m*(1.-c) + c*(1.-m);
        }
    }

    fragColor = vec4(hsv2rgb(vec3(m * 0.7, 1.0, 1.0)), 1.0);
}
