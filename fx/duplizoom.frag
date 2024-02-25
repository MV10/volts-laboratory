#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)

// resolution: how many images make up one image, both horizontally and vertically
//#define R 160.0
#define R (resolution.x / 5.0)

#define T(z) texture(input0, round(fract((fragCoord / resolution.xy - 0.5) * pow(R, z) + 0.5) * R) / R)

void main()
{
    //float z = fract(2.0 * acos(0.96 * cos(0.1 * time)) - 0.7);    // alternately zoom in and out
    //float z = fract(0.2 * time);     // zoom out forever
    //float z = fract(-0.2 * time);    // zoom in forever

    float z = (randomrun < 0.5) ? fract(0.2 * time) : fract(-0.2 * time);
    
    fragColor = mix(T(z), T(z - 1.0), z);
}