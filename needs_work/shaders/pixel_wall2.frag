#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iChannel0 input1

void main()
{
    fragColor = vec4(0);
    vec2  res = textureSize(iChannel0, 0);
    float s = res.y / 450.0;

    // Discard pixels outside of working area for performance.
    if (fragCoord.x > (res.x + 31.0) / 16.0) discard;

    // Horizontal reduction for anamorphic flare.
    for (int x = 0; x < 8; x++)
    {
        fragColor.z += 0.25 * texture(iChannel0, min(vec2(1.0 / 4.0, 1.0),
            vec2(4.0, 1.0) * (fragCoord + 0.5 * s * vec2(float(x) - 3.5, 0)) / res)).z;
    }

    if (fragCoord.y <= (res.y + 31.0) / 16.0)
    {
        // Horizontal and vertical reduction for regular bloom.
        for (int y = 0; y < 5; y++)
        for (int x = 0; x < 5; x++)
        {
            fragColor.y += 0.04 * texture(iChannel0, min(vec2(1.0 / 4.0),
                (4.0 * (floor(fragCoord) + s * (vec2(x,y) - 2.0))) / res)).y;
        }
    }
}
