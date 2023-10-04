#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputB;
uniform sampler2D inputC;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputB
#define iChannel1 inputC

void main()
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	fragColor = max(texture(iChannel0,uv),texture(iChannel1,uv+0.002));
}
