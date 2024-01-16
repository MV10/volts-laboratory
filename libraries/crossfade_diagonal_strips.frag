#version 460
precision highp float;

// Adapted from https://www.shadertoy.com/view/dtdyWf
// My revisions https://www.shadertoy.com/view/lfXSWM

in vec2 fragCoord;
uniform float fadeLevel;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

uniform float fadeDuration;

#define uv fragCoord
#define iChannel0 oldBuffer
#define iChannel1 newBuffer

#define PI 3.1415

void main()
{
    float diff = uv.x - uv.y;

    // Has a one-frame flash of the new buffer at the start,
    // and a one-frame flash of the old buffer at the end.
    // 0.003 is the fadeLevel step at 60 FPS for 5 sec.
    if(fadeLevel <= 0.003)
    {
        fragColor = texture(oldBuffer, uv);
        return;
    }

    if(fadeLevel >= 0.997)
    {
        fragColor = texture(newBuffer, uv);
        return;
    }

    float t = fadeLevel * PI / 2.0;
    t = sin(-t - floor(-t * 2.0 / PI) * PI / 2.0);

    float offset;

    if(diff < -0.5)
    {
    	offset = -1.0 * t;
    }
    else if(diff > -0.5 && diff < 0.0)
    {
    	offset = 1.0 * t;
    }
    if(diff > 0.0 && diff < 0.5)
    {
        offset = -1.0 * t;
    }
    else if(diff > 0.5 && diff < 1.0)
    {
    	offset = 1.0 * t;
    }
        
    vec2 pq =  uv + vec2(offset, offset);
    fragColor = (pq.y > 1.0 || pq.y < 0.0 || pq.x > 1.0 || pq.x < 0.0)
        ? texture(oldBuffer, uv)
        : texture(newBuffer, pq);
}
