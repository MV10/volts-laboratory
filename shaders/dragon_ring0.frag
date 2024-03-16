#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputA
#define iChannel1 eyecandyShadertoy

float gyroid (vec3 seed) { return dot(sin(seed),cos(seed.yzx)); }

// crazy noise
float fbm (vec2 pos)
{
    vec3 p = vec3(pos, iTime*.1);
    float result = 0., a = .5;
    for (int i = 0; i < 3; ++i, a /= 2.) {
        result += abs(gyroid(p/a)*a);
    }
    result = sin(result*6.283+iTime*.5-length(pos));
    return result;
}

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    vec2 p = (2.*fragCoord-iResolution.xy)/iResolution.y;
    
    // curl noise
    vec2 e = vec2(1./iResolution.y,0);
    vec2 curl = vec2(fbm(p+e.xy)-fbm(p-e.xy), fbm(p+e.yx)-fbm(p-e.yx)) / (2.*e.x);
    curl = vec2(curl.y, -curl.x);
    
    // spawn shape
    float dist = abs(length(p)-.5);
    float mask = smoothstep(.01, 0., dist);
    
    // displace
    curl *= 0.005;
    vec4 frame = texture(iChannel0, uv + curl);

    // feedback
    float FFT = texture(iChannel1, vec2(0.07, 0.25)).g * 0.005;
    mask = max(mask, frame.r - FFT);
    
    fragColor = vec4(mask, curl, 1);
}
