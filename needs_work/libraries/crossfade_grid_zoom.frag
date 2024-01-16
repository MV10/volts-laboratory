#version 460
precision highp float;

// Adapted from https://www.shadertoy.com/view/3tjXWd
// My revisions https://www.shadertoy.com/view/MffSzj
// ...un-golfed because that's just silly.

in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

uniform float fadeLevel;
uniform vec2 resolution;
uniform float randomrun;
#define uv fragCoord

// lol
#define rnd(p) fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123)

void main()
{
    float rows = 6.0 / resolution.y;
    vec2 point = fragCoord * rows;
    
    float t = fract(fadeLevel * 0.9);
    float mt = ceil(fadeLevel * 0.9);

    float cellStartTime = rnd(ceil(point) * mt) * 0.5;
    float w = 0.25 + 0.75 * smoothstep(0.0, 0.175, t - cellStartTime - 0.225);

    vec2 box = (t < cellStartTime)
        ? vec2(0) 
        : smoothstep(rows, 0.0, abs(fract(point) - 0.5) - w / 2.0);
   
   fragColor = mix(texture(oldBuffer, uv), texture(newBuffer, uv), box.x * box.y);
 }
 