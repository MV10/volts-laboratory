#version 450
precision highp float;

in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
uniform float fadeLevel;
uniform float randomrun;
uniform vec2  resolution;
out vec4 fragColor;

// Fast stable hash returning 0..1
float hash11(float p)
{
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= 2.0 * p;
    return fract(p);
}

void main()
{
    vec2 pixel = fragCoord * resolution;
    vec2 norm  = fragCoord;

    float r = hash11(randomrun * 7.31 + 1.91);

    // 10 to 30 vertical strips (columns)
    int numStrips = 10 + int(hash11(r + 3.71) * 21.0);

    float pixelsPerStrip = resolution.x / float(numStrips);

    int stripIdx = int(floor(pixel.x / pixelsPerStrip));

    // Alternate vertical slide direction per strip
    // Even strips slide upward, odd strips slide downward
    bool slideUp = (stripIdx & 1) == 0;
    float dir    = slideUp ? -1.0 : 1.0;   // negative = up, positive = down

    float progress = fadeLevel;

    // Both old and new content move together in the strip's direction
    vec2 oldUV = vec2(norm.x, norm.y + dir * progress);
    vec2 newUV = vec2(norm.x, norm.y + dir * (progress - 1.0));

    vec4 color;

    if (slideUp)
    {
        // Content slides upward: old exits top, new enters from bottom
        if (oldUV.y >= 0.0)
        color = texture(oldBuffer, oldUV);
        else
        color = texture(newBuffer, newUV);
    }
    else
    {
        // Content slides downward: old exits bottom, new enters from top
        if (oldUV.y < 1.0)
        color = texture(oldBuffer, oldUV);
        else
        color = texture(newBuffer, newUV);
    }

    fragColor = color;
}