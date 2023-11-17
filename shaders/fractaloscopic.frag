#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D eyecandyWebAudio;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iChannel0 eyecandyWebAudio

const float PI = 3.14159265359;

float NUM_SIDES;
float KA;

void smallKoleidoscope(inout vec2 uv)
{
  float angle = abs (mod (atan (uv.y, uv.x), 2.0 * KA) - KA) + 0.1*time;
  uv = length(uv) * vec2(cos(angle), sin(angle));
}

void main() 
{
    NUM_SIDES = 4.0 + (clamp(sin(time), -0.2, 0.2) * 6.0);
    KA = PI / NUM_SIDES;

    vec2 uv = 12.0*(2.0 * fragCoord.xy / resolution.xy - 1.0);
    uv.x *= resolution.x / resolution.y;

    // average several rows of history data
    vec2 mouse;
    for(float y = 0.0; y < 4.0; y++)
        mouse = vec2(texture(iChannel0, vec2(0.6, y + 0.5)).y);
    mouse /= 4.0;

    uv *= 0.1+mouse.x;

    smallKoleidoscope(uv);

    vec3 p = vec3 (uv, mouse.x);
    for (int i = 0; i < 44; i++)
        p.xzy = vec3(1.3,0.999,0.678)*(abs((abs(p)/dot(p,p)-vec3(1.0,1.02,mouse.y*0.4))));

    fragColor = vec4(p,1.0);
}
