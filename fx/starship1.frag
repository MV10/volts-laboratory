#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input1;
uniform sampler2D ship;
uniform sampler2D windows;
out vec4 fragColor;

void main()
{
    vec3 starship = texture(ship, fragCoord).rgb;
    vec3 window_mask = texture(windows, fragCoord).rgb;
    vec3 exterior = texture(input1, fragCoord).rgb;
    fragColor.rgb = (window_mask.r < 0.1) ? starship : exterior;
}

