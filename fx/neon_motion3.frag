#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputC;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputC
#define iChannel1 inputB

void main()
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    
    vec3 color1 = texture(iChannel0, uv).rgb;
    vec3 color2 = texture(iChannel1, uv).rgb;
    
    float motion = abs((0.299*color1.r + 0.587*color1.g + 0.114*color1.b) - (0.299*color2.r + 0.587*color2.g + 0.114*color2.b));
    
    vec3 color = 10.0 * motion * mix(vec3(112.0, 20.0, 66.0), vec3(20.0, 112.0, 66.0), 0.5 * cos(iTime) + .5) / 255.0;
    
    fragColor = vec4(color, 1.0);
}
