#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
out vec4 fragColor;

vec3 rgb2hsv(vec3 c);
vec3 hsv2rgb(vec3 c);

void main()
{
	vec3 hsv = rgb2hsv(texture(input0, fragCoord).rgb);
	float hue = sin(time * hsv.x);
	fragColor = vec4(hsv2rgb(vec3(hue, max(0.5, hsv.y), hsv.z)).rgb, 1.0);
}
