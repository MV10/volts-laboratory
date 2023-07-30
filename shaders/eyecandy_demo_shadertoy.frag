#version 320 es
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D sound;
out vec4 fragColor;

float plot(float uvy, float liney, float lineWidth)
{
    float pos = smoothstep(uvy - lineWidth, uvy, liney) - smoothstep(uvy, uvy + lineWidth, liney);
	return pos;
}

void main()
{
	vec2 uv = fragCoord;
    float timeDomain = texture(sound, vec2(uv.x, 0.75)).g;
    float frequencyDomain = texture(sound, vec2(uv.x, 0.25)).g;
    float t = plot(uv.y*2.0 - 1.0, timeDomain, 0.02);
    float f = plot(uv.y*2.0, frequencyDomain, 0.01);
 	fragColor = vec4(t, f, 0.0, 1.0);
}
