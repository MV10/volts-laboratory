#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

mat2 rotate(float angle)
{
    // mcguirev10 - sometimes clockwise, sometimes not
    float a = angle * sign(0.5 - randomrun);
    float c = cos(a);
    float s = sin(a);
    return mat2(c,-s,s,c);
}

// de-obfuscated (un-"golfed")
void main()
{
	// mcguirev10 - border attenuation (https://www.shadertoy.com/view/cscBDM)
	// 0.1 = small center, 0.9 = nearly no border
	float center_size = 0.6; 

	vec2 uv = fragCoord / iResolution.xy - 0.5;
    fragColor = vec4(0);
   
    for(float i = 0.0; i < 3.0; i++) 
    {
        float ti = time + 6.283 / 3.0 * i;
        float wi = (0.5 - 0.5 * cos(ti)) / 1.5;
        float v = 3.0 / (0.05 + length(uv));
        vec2 uvi = uv * rotate(0.3 * (-0.5 + fract(ti / 6.283)) * v);

        //fragColor += texture(iChannel0, 0.5 + uvi) * wi;
        
		// mcguirev10 - border attenuation
        vec2 pos = 0.5 + uvi;
        vec4 color = texture(iChannel0, pos) * wi;
		vec2 fade_coords = 1.0 - smoothstep(vec2(center_size), vec2(1.0), abs(2.0 * pos - 1.0));
		float fade_factor = fade_coords.x * fade_coords.y;
		color = mix(vec4(0), color, fade_factor);
        fragColor += color;
    }
}