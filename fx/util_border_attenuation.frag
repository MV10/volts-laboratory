#version 460
precision highp float;

// Based on my border attenuation https://www.shadertoy.com/view/cscBDM

// This should always be the first shader applied to the primary:
// [multipass]
// 1 0 util_border_attenatuion.fragColor
// 2 1 fx.frag

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
out vec4 fragColor;

// 0.1 = small center, 0.9 = nearly no border
uniform float attenuation_center_size = 0.6;

void main() 
{
	vec2 fade_coord = 1.0 - smoothstep(vec2(attenuation_center_size), vec2(1), abs(2.0 * fragCoord - 1.0));
    float fade_factor = fade_coord.x * fade_coord.y;

    vec4 fore = texture(input0, fragCoord);
    vec4 back = vec4(0);

    fragColor = mix(back, fore, fade_factor);
	
}
