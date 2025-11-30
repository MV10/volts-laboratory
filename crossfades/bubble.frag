#version 450
precision highp float;

in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
uniform float fadeLevel;
uniform vec2 resolution;
out vec4 fragColor;

void main()
{
    vec2 c = vec2(0.5);
    float ar = resolution.x / resolution.y;

    // aspect-corrected position, center at origin
    vec2 p = (fragCoord - c) * vec2(ar, 1.0);

    // radius of inscribed circle that touches nearest screen edges
    float circleR = min(0.5 * ar, 0.5);

    // half-extents of full-screen rectangle
    vec2 rectHalf = vec2(0.5 * ar, 0.5);

    // split the animation into two phases
    // 0.0 to 0.5 : grow sphere from point to inscribed circle
    // 0.5 to 1.0 : morph from circle to full rectangle (existing logic)
    float growEnd = 0.5;
    float phase = fadeLevel / growEnd;

    float currentR;
    float sd;

    if (fadeLevel <= growEnd)
    {
        // Phase 1: growing sphere from point to inscribed circle
        currentR = circleR * phase;                     // radius grows linearly
        sd = length(p) - currentR;                      // simple circle boundary
    }
    else
    {
        // Phase 2: morph from full circle to full rectangle (original verified logic)
        float t = (fadeLevel - growEnd) / (1.0 - growEnd);  // remap 0.5-1.0 to 0.0-1.0

        float sdCircle = length(p) - circleR;
        float sdRect   = max(abs(p.x) - rectHalf.x, abs(p.y) - rectHalf.y);
        sd = mix(sdCircle, sdRect, t);

        currentR = mix(circleR, length(rectHalf), t);
    }

    // outside the current shape: show old buffer
    if (sd > 0.0)
    {
        fragColor = texture(oldBuffer, fragCoord);
        return;
    }

    // normalized distance from center (0 at center, 1 at current edge)
    float r = length(p) / currentR;

    // hemisphere height at this normalized radius
    float h = sqrt(max(0.0, 1.0 - r * r));

    // 3D point on unit hemisphere
    vec3 pos3D = vec3(p / currentR, h);

    // surface normal
    vec3 n = normalize(pos3D);

    // stereographic projection to texture coordinates
    vec2 sphereUV = n.xy / (n.z + 1.0);
    sphereUV = sphereUV * 0.5 + vec2(0.5);

    // blend from full sphere (early) to flat screen (late)
    // during growth phase we want full sphere, so use 0.0 blend until phase 2
    float blendT = max(0.0, (fadeLevel - growEnd) / (1.0 - growEnd));

    vec2 finalUV = mix(sphereUV, fragCoord, blendT);

    fragColor = texture(newBuffer, finalUV);
}
