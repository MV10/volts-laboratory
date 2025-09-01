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
uniform sampler2D buttons;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

vec3 scaled_sobel()
{
    // 35% of original size
    float scale = 0.35; 
    
    // center in viewport
    vec2 uv = (fragCoord - 0.5) / scale + 0.5;
    
	// offset, computer-screen masks aren't centered
	uv.x -= 0.1;
	uv.y += 0.3;

    // black out of bounds
    if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);

    // x2 to brighten it up
    vec3 color = texture(input2, uv).rgb * 2.0;

    // bluish tint
    color *= vec3(0.25, 0.75, 1.0);

    return color;
}

vec3 audio_pulse()
{
    // Base color: yellow-white (1.00, 0.97, 0.73)
    vec3 color = vec3(1.00, 0.97, 0.73);

    float beat = texture(eyecandyShadertoy, vec2(0.09, 0.25)).g;

    // Reduce brightness by 50% at beat = 0.0, scale to full white (1.0, 1.0, 1.0) at beat = 1.0
    float brightness = mix(0.5, 1.0, beat); // Linearly interpolate brightness
    vec3 pulsedColor = mix(color * 0.5, vec3(1.0), beat); // Interpolate between dimmed color and white

    return clamp(pulsedColor, 0.0, 1.0); // Ensure color values stay within valid range}
}

void main()
{
    vec3 starship = texture(ship, fragCoord).rgb;
    vec3 exterior = texture(input1, fragCoord).rgb;
    vec3 computer = scaled_sobel();
    vec3 blinkers  = audio_pulse();

    vec3 window_mask = texture(windows, fragCoord).rgb;
    vec3 computer_mask = texture(screens, fragCoord).rgb;
    vec3 buttons_mask = texture(buttons, fragCoord).rgb;
    vec3 all_masks = window_mask + computer_mask + buttons_mask;

    fragColor.rgb = 
        (starship * (1.0 - all_masks)) 
        + (exterior * window_mask)
        + (computer * computer_mask)
        + (blinkers * buttons_mask);
}

