#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iChannel0 input0
#define iChannel1 inputB
#define iResolution resolution

void main()
{
    vec2 uv = fragCoord / iResolution.xy;
    float a = (uv.x * uv.y)*20.;
    vec3 feedback = texture(iChannel1, uv + 0.001*vec2(sin(a), cos(a))).rgb;
    vec3 video = texture(iChannel0, uv).rgb;
    feedback.r = pow(feedback.r, 1.01)+0.001;
    feedback.g = pow(feedback.g, 1.02)+0.001;
    feedback.b = pow(feedback.b, 1.03)+0.001;
    fragColor = vec4(mix(video, feedback, 0.95 + 0.05*fract(video.r*8.33)), 1.0);
}

