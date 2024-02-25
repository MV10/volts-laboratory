#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D iChannel0;
uniform sampler2D iChannel2;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel1 input0

const float PI = 3.14159265;

float select_range(float x, float a, float b) 
{
    return (x < a) ? 0.0 : (x > b) ? 0.0 : 1.0;
}

float vec_agle(vec2 v) 
{
	v = normalize(v);
	return (v.y > 0.0) ? acos(v.x) : -acos(v.x);
}

float point(vec2 uv) {
    float n = texture(iChannel0, uv).x;
    n = select_range(n, 0.45, 0.451);
    return n;
}

float starburst(vec2 uv, vec2 p, float s) 
{
    vec2 q = p - uv;
    float a = vec_agle(q) * 3.0 + iTime;
    float w = 0.001 * s;
    a = (2.0 / w) * (pow(sin(a), 2.0) - (1.0 - w)) * 1.0;
    float r = 1.0 - clamp(length(q) * (2.0 / s), 0.0, 1.0);
    float n = s * 0.2 * pow(2.0, -pow(length(q * 32.0), 2.0));
    float m = pow(r, 32.0);
    return n + clamp(m * mix(a * 4.0, r * 10.0 * s, r), 0.0, 1.0);
}

float lum(vec3 v) 
{
    return v.x + v.y + v.z;
}

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    float x = 0.0;
    int n = 8;
    float da = 2.0 * PI / float(n);
    float r_max = 8.0;
    float dr = 1.0;
    fragColor = texture(iChannel1, uv);
    int nx = 8;
    int ny = 8;
    for(int i = 0; i < nx; i += 1) {
        for(int j = 0; j < ny; j += 1) {
            vec2 t = vec2(i, j) / vec2(nx, ny);
            vec2 o = texture(iChannel2, t + 0.1 * vec2(iTime / textureSize(iChannel0, 0).x, 0.0)).xy;
            t += o * 0.55;
            float l = lum(texture(iChannel1, t).xyz);
            float tr = 1.8;
            float s = (l - tr) / (3.0 - tr);
            if(l > 1.8) x += starburst(uv, t, s * 2.0);
        }
    }
    fragColor.xyz += vec3(x);
}