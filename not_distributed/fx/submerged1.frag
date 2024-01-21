#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;  // not actually used here
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime (time + randomrun * 300.0)
#define iChannel0 input0

#define ROUGHNESS 0.25
#define DEPTH 100.0

#define LIGHT
#define SPEC

#define BUMPSTRENGTH 1000.0 * ROUGHNESS
#define LIGHTSTRENGTH 1.0
#define SPECULAR 0.92

#define SCALE 2.0

mat2 rot2( float a ){ vec2 v = sin(vec2(1.570796, 0) + a);	return mat2(v, -v.y, v.x); }

vec3 random (in vec2 st) 
{
    vec3 r;
    r.x = fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    r.y = fract(sin(dot(st.xy + vec2(st.x), vec2(12.9898,78.233))) * 43758.5453123);
    r.z = fract(sin(dot(st.xy + vec2(st.y), vec2(12.9898,78.233))) * 43758.5453123);
    return r;
}

vec3 noise (in vec2 st) 
{
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec3 a = random(i);
    vec3 b = random(i + vec2(1.0, 0.0));
    vec3 c = random(i + vec2(0.0, 1.0));
    vec3 d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 fbm (in vec2 st) 
{
    vec3 value = vec3(0.0);
    float amplitude = 0.5;
    float frequency = 0.0;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st = st * rot2(0.5) * 2.0 + vec2(100.0, 0.0);
        amplitude *= 0.5;
    }
    return value;
}

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    uv.x *= iResolution.x/iResolution.y;
    uv *= SCALE;
    
    vec2 p = vec2(fbm(uv + iTime * ROUGHNESS).r, fbm(uv - iTime * ROUGHNESS).r);
    
    fragColor = vec4(fbm(uv + p), 1.0);
}
