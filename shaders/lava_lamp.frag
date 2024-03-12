#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

vec3 pal(float t) 
{
    vec3 b = vec3(0.45);
    vec3 c = vec3(0.35);
    return b + c * cos(6.28318 * (t * vec3(1) + vec3(0.7, 0.39, 0.2)));
}

// see https://www.youtube.com/watch?v=-adHIyjIYgk
float gyroid(vec3 p, float scale) 
{
    p *= scale;
    float bias = mix(1.1, 2.65, sin(iTime * 0.4 + p.x / 3.0 + p.z / 4.0) * 0.5 + 0.5);
    float g = abs(dot(sin(p * 1.01), cos(p.zxy * 1.61)) - bias) / (scale * 1.5) - 0.1;
    return g;
}

float scene(vec3 p) 
{
    float g1 = 0.7 * gyroid(p, 4.0);
    return g1;
}

vec3 norm(vec3 p) 
{
    mat3 k = mat3(p, p, p) - mat3(0.01);
    return normalize(scene(p) - vec3(scene(k[0]), scene(k[1]), scene(k[2])));
}

void main()
{
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 init = vec3(iTime * 0.25, 1.5, 0.3);
    vec3 cam = normalize(vec3(1.0, uv ));

    vec3 p = init;
    bool hit = false;
    for (int i = 0; i < 100 && !hit; i++) {
        if (distance(p, init) > 8.0) break;
        float d = scene(p);
        if (d * d < 0.00001) hit = true;
        p += cam * d;
    }
    vec3 n = norm(p);

    float ao = 1.0 - smoothstep(-0.3, 0.75, scene(p + n * 0.4)) * smoothstep(-3.0, 3.0, scene(p + n * 1.0));
    
    float fres = -max(0.0, pow(0.8 -abs(dot(cam, n)), 3.0));
    vec3 vign = smoothstep(0.0, 1.0, vec3(1.0 - (length(uv * 0.8) - 0.1)));
    vec3 col = pal(0.1 - iTime * 0.01 + p.x * 0.28 + p.y * 0.2 + p.z * 0.2);
    col = (vec3(fres) + col) * ao;
    col = mix(col, vec3(0.0), !hit ? 1.0 : smoothstep(0.0, 8.0, distance(p, init)));
    col = mix(vec3(0), col, vign + 0.1);
    col = smoothstep(0.0, 1.0 + 0.3 * sin(iTime + p.x * 4.0 + p.z * 4.0), col);
    fragColor.xyz = col;
    fragColor.xyz = sqrt(fragColor.xyz);
}
