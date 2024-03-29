#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D eyecandyFreqDB;
out vec4 fragColor;

// parameters randomized in swirly.conf
uniform float random_time_frequency;
uniform float random_spiral_frequency;
uniform float random_displacement_amount;

#define fragCoord (fragCoord * resolution)

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;
const float PI_OVER_TWO = 1.57079632679;

void main()
{
    vec2 uv_screen = fragCoord / resolution.xy; //The texture coordinates normalised to [0,1]
    vec2 uv = (fragCoord - resolution.xy * 0.5) / resolution.y; //Gives a square aspect ratio
    
    // PARAMETERS TO EDIT
    //float time_frequency = 1.;          // change over time (hertz)
    //float spiral_frequency = 10.;       // vertical ripple peaks
    //float displacement_amount = 0.02;   // how much the spiral twists

    // Small +/- audio input
    float beat = 0.5 - texture(eyecandyFreqDB, vec2(mix(0.001, 0.115, 0.), 0)).g;

    float time_frequency = random_time_frequency;// + (beat * 0.1);
    float spiral_frequency = random_spiral_frequency + (beat * 1.5);
    float displacement_amount = random_displacement_amount; // + (beat * 0.1);
    
    // Spiral (based on polar coordinates fed through a sinusoidal function
    vec2 uv_spiral = sin(vec2(-TWO_PI * time * time_frequency +         //causes change over time
                              atan(uv.x, uv.y) +                        //creates the spiral
                              length(uv) * spiral_frequency * TWO_PI,   //creates the ripples
                              0.));

    // Displace a texture by the spiral value
    fragColor = vec4(texture(input0, uv_screen + uv_spiral * displacement_amount));
}