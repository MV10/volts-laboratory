#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input1;
uniform sampler2D input2;
uniform sampler2D ship;
uniform sampler2D windows;
uniform sampler2D screens;
out vec4 fragColor;

vec3 scaled_sobel()
{
    // 30% of original size
    float scale = 0.3; 
    
    // horizontally centered, vertically lowered
    vec2 uv = (fragCoord - 0.5) / scale + 0.5;
    uv.y += 0.2;

    // black out of bounds
    if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);

    // x2 to brighten it up
    return texture(input2, uv).rgb * 2.0;
}

vec3 audio_pulse()
{
    return vec3(1.0);
}

void main()
{
    vec3 starship = texture(ship, fragCoord).rgb;
    vec3 exterior = texture(input1, fragCoord).rgb;
    vec3 computer = scaled_sobel();
    vec3 buttons  = audio_pulse();

    vec3 window_mask = texture(windows, fragCoord).rgb;
    vec3 computer_mask = texture(screens, fragCoord).rgb;
    // vec3 buttons_mask = texture(buttons, fragCoord).rgb;

    vec3 all_masks = window_mask + computer_mask; // + buttons_mask;

    fragColor.rgb = 
        (starship * (1.0 - all_masks)) 
        + (exterior * window_mask)
        + (computer * computer_mask);
        // + (buttons * buttons_mask);
}

