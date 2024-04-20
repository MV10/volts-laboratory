#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D iChannel0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

// Unpublished fork of Hell Diving https://shadertoy.com/view/lcGGzK

float gyroid(vec3 p) 
{ 
    return dot(cos(p), sin(p.yzx)); 
}

float fbm(vec3 p)
{
    float result = 0.0;
    float a = 0.5;
    for (float i = 0.0; i < 8.0; ++i)
    {
        p.z += (result + iTime) * 0.1;
        result += abs(gyroid(p / a) * a);
        a /= 1.6;
    }
    return result;
}

vec3 getColor(vec3 ray, int i)
{
    ivec2 pp = (ivec2(fragCoord) + (i * 196) * ivec2(113, 127)) & 1023;
    vec3 blu = texelFetch(iChannel0, pp, 0).xyz;
    vec3 e = vec3(0.1 * blu.y * vec2(iResolution.x / iResolution.y), 0.0);
    #define T(u) fbm(ray+u)
    vec3 normal = normalize(T(0.0) - vec3(T(e.xzz), T(e.zyz), 1.0));
    return 0.2 + 1.0 * cos(vec3(1, 2, 3) * 5.5 + normal.y);
}

// mcguirev10 - rotation is more fun-er-er
const float pi_deg = 3.141592 / 180.0;
mat2 rotationMatrix(float angle)
{
	angle *= pi_deg;
    float s=sin(angle), c=cos(angle);
    return mat2(c, -s, s, c);
}

void main()
{
    vec2 uv = (2.*fragCoord-iResolution.xy)/iResolution.y;
    
    // mcguirev10 - yay
    uv *= rotationMatrix(time * 34.0 * (randomrun - 0.5) + (4.0 * sign(randomrun - 0.5)));
    
    vec3 ray = normalize(vec3(uv,.5));
    vec3 color = vec3(0);
    
    const float count = 9.;
    for (float i = 0.; i < count; ++i)
    {
        color += getColor(ray, int(i)) / count;
    }

    fragColor = vec4(color,1.0);
}
