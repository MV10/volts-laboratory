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

    int numStrips = 10 + int(hash11(r + 3.71) * 21.0);

    float pixelsPerStrip = resolution.y / float(numStrips);

    int stripIdx = int(floor(pixel.y / pixelsPerStrip));

    bool slideRight = (stripIdx & 1) == 0;
    float dir       = slideRight ? 1.0 : -1.0;

    float progress  = fadeLevel;

    // Both old and new content move in the SAME direction for this strip
    // Old starts fully visible and slides off
    // New starts off-screen on the incoming side and slides in

    vec2 oldUV = vec2(norm.x + dir * progress, norm.y);
    vec2 newUV = vec2(norm.x + dir * (progress - 1.0), norm.y);

    vec4 color;

    if (slideRight)
    {
        // Everything in this strip slides right
        if (oldUV.x < 1.0)
        color = texture(oldBuffer, oldUV);
        else
        color = texture(newBuffer, newUV);
    }
    else
    {
        // Everything in this strip slides left
        if (oldUV.x >= 0.0)
        color = texture(oldBuffer, oldUV);
        else
        color = texture(newBuffer, newUV);
    }

    fragColor = color;
}
