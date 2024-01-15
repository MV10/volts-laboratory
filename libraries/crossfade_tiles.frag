#version 460
precision highp float;

// Adapted from https://www.shadertoy.com/view/mtdcWn (1 of 6)
// My revisions https://www.shadertoy.com/view/MffXWM

in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

uniform float fadeLevel;
uniform vec2 resolution;
uniform float randomrun;

#define iResolution resolution

void main()
{
    vec2 uv = fragCoord;
    float aspectRatio = iResolution.x / iResolution.y;
    vec2 uvOriginal = uv;
    vec2 uvCenter = (uv - 0.5) * 2.0;
    uv.x *= aspectRatio;

    uv = fract(uv * 10.0); // tiling factor
    uv -= 0.5; // shifts the 0.0 point to the middle of each tile
    uv *= 2.0; // changes the scale of each tile to -1 to 1
    
    float timing;
    float value;

    int fx = int(floor(randomrun * 6.0));
    switch(fx)
    {
        case 0: // Circular tile
        {
            timing = fadeLevel * 1.42;
            value = step(timing, length(uv));
            break;
        }

        case 1: // Horizontal wipe
        {
            timing = fadeLevel * 2.0 - 1.0;
            value = step(timing, uv.x);
            break;
        }

        case 2: // Vertical wipe
        {
            timing = fadeLevel * 2.0 - 1.0;
            value = step(timing, uv.y);
            break;
        }

        case 3: // Center-out grid
        {
            timing = fadeLevel;
            value = step(timing, abs(uv.x)) + step(timing, abs(uv.y));
            break;
        }

        case 4: // Edges-in grid
        {
            timing = (fadeLevel * 2.0 - 1.0) + min(length(uvCenter), 1.0);
            value = step(timing, abs(uv.x)) + step(timing, abs(uv.y));
            break;
        }

        case 5: // Top-right to bottom-left
        {
            timing = fadeLevel * 2.0 - 1.0;
            value = step(timing + uvOriginal.x, abs(uv.x)) + step(timing + uvOriginal.y , abs(uv.y));
            break;
        }
    }

    vec4 texture1 = texture(newBuffer, uvOriginal);
    vec4 texture2 = texture(oldBuffer, uvOriginal);

    vec4 textureOutput = mix(texture1, texture2, min(value, 1.0));

    fragColor = vec4(textureOutput);
}
