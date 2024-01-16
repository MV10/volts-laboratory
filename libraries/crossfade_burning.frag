#version 460
precision highp float;

// Adapted from https://www.shadertoy.com/view/clKBzh
// My revisions https://www.shadertoy.com/view/lfXXWM

in vec2 fragCoord;
uniform float fadeLevel;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

uniform float fadeDuration;
uniform vec2 resolution;
uniform float randomrun;

#define uv fragCoord
#define iResolution resolution
#define iChannel0 oldBuffer
#define iChannel1 newBuffer

// original was 100
#define tint (50.0 + 50.0 * randomrun)

// add some real randomness to the cornball Shadertoy hack for pseudo-random numbers
#define pseudorandom max(0.15, randomrun)

float random(vec2 st) 
{
    return fract(sin(dot(st, vec2(94.23, 48.127)) + 14.23) * 1124.23 * pseudorandom);
}

float noise(vec2 st) 
{
    vec2 ip = floor(st);
    vec2 fp = fract(st);
    float a = random(ip);
    float b = random(ip + vec2(1.0, 0.0));
    float c = random(ip + vec2(0.0, 1.0));
    float d = random(ip + vec2(1.0, 1.0));
    vec2 u = smoothstep(0.0, 1.0, fp);
    return mix(mix(a, b, u.x),mix(c, d, u.x), u.y);
}

float fractalNoise(vec2 uv) 
{
    uv *= 20.0 + (40.0 * randomrun); // "graininess" of the yellow-orange flame area
    float amp = 0.6;
    float n = 0.0;
    for (int i = 0; i < 6; i++)
    {
        n += noise(uv) * amp;
        uv *= 2.0;
        amp *= 0.5;
    }
    return n;
}

float displace(vec2 uv) 
{
    uv = mix(uv, vec2(fractalNoise(uv)), 0.08);
    float d = fadeLevel * 1.5; // -0.1 + mod(iTime * 0.1, 1.5);
    vec2 d1 = vec2(0.5, 0.5) + noise(uv * 3.0) - 0.5;
    return smoothstep(d, d + 0.08, distance(uv, d1));
}

vec3 burn(vec3 col, vec2 uv) 
{
    float a = displace(uv);
    vec3 b = (1.0 - a) * vec3(1.0, 0.14, 0.016) * a * tint;
    return col * a + b;
}

void main()
{
    vec3 rgb = texture(oldBuffer, uv).rgb;
    vec2 st = uv * vec2(iResolution.x / iResolution.y, 1.0);
    rgb = burn(rgb, st);
    
    // if-test is cheesy, but it works
    fragColor = (rgb == vec3(0))
        ? texture(newBuffer, uv)
        : vec4(rgb, 1.0);
}