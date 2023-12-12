#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D inputD;
uniform sampler2D inputE;
out vec4 fragColor;

// mcguirev10 - a good range seems to be about 0.65 to 0.95, 1.0 is the full effect
// despite the name, this is really the FX mix factor (1.0 is 100% FX output only)
// some like peacock_feathers work well with a random range (0.85 : 0.995)
uniform float primary_mix_factor = 0.85;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputD
#define iChannel1 inputE

void main()
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    
    vec3 col_0 = texture(iChannel0, uv).rgb;
    vec3 col_1 = texture(iChannel1, uv).rgb;
    
    fragColor = vec4(mix(col_1, clamp(col_0, col_1 - 1.0 /255.0, col_1 + 96.0 / 255.0), 0.75), 1.0);

    // mcguirev10 - mixing in the primary shader output prevents it from turning too dark
    fragColor = mix(texture(input0, uv), fragColor, primary_mix_factor);
}
