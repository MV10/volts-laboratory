#version 450
precision highp float;

in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
uniform float fadeLevel;      // 0.0 to 1.0 animation progress
uniform vec2 resolution;
out vec4 fragColor;

void main()
{
    vec2 c = vec2(0.5);                                   // screen center
    float ar = resolution.x / resolution.y;               // aspect ratio

    // aspect-corrected coordinates, origin at center
    vec2 p = (fragCoord - c) * vec2(ar, 1.0);

    // radius of largest inscribed circle (touches shortest screen edge)
    float circleR = min(0.5 * ar, 0.5);

    // half-extents of full screen rectangle
    vec2 rectHalf = vec2(0.5 * ar, 0.5);

    // EXTREME acceleration: almost frozen at start, explodes at the end
    // power 7.0 makes the first ~70 percent of fadeLevel feel nearly static
    float eased = 1.0 - pow(1.0 - fadeLevel, 7.0);

    // flattening + morph now only last 5 percent
    float flattenStart = 0.95;

    float currentR;   // radius of current shape in aspect-corrected space
    float sd;         // signed distance to current shape
    float flattenT = 0.0;  // 0 = full sphere, 1 = completely flat

    if (eased < flattenStart)
    {
        // growth phase - first 95 percent of animation time
        float phase = eased / flattenStart;
        currentR = circleR * phase;
        sd = length(p) - currentR;
        flattenT = 0.0;
    }
    else
    {
        // flattening + morph phase - last 5 percent only
        float t = (eased - flattenStart) / (1.0 - flattenStart);
        float sdCircle = length(p) - circleR;
        float sdRect   = max(abs(p.x) - rectHalf.x, abs(p.y) - rectHalf.y);
        sd = mix(sdCircle, sdRect, t);
        currentR = mix(circleR, length(rectHalf), t);
        flattenT = t;
    }

    // inside current shape - show newBuffer with sphere-to-flat mapping
    if (sd <= 0.0)
    {
        float r = length(p) / currentR;
        float h = sqrt(max(0.0, 1.0 - r * r));               // hemisphere height
        vec3 pos3D = vec3(p / currentR, h);                  // point on unit hemisphere
        vec3 n = normalize(pos3D);                          // surface normal
        vec2 sphereUV = n.xy / (n.z + 1.0);                  // stereographic projection
        sphereUV = sphereUV * 0.5 + vec2(0.5);
        vec2 finalUV = mix(sphereUV, fragCoord, flattenT);   // blend to flat
        fragColor = texture(newBuffer, finalUV);
    }

    // outside current shape - 20 strong constant-width ripple rings
    else
    {
        // current edge radius using the same extreme eased timing
        float shapeR;
        if (eased < flattenStart)
        shapeR = circleR * (eased / flattenStart);
        else
        shapeR = mix(circleR, length(rectHalf), (eased - flattenStart) / (1.0 - flattenStart));

        float dist = length(p);
        float excess = dist - shapeR;

        // 20 constant-width rings moving outward
        float wavePos = excess * 40.0 - fadeLevel * 30.0;
        float ripple = sin(wavePos);

        // sharpen waveform - tall crests, deep troughs
        ripple = sign(ripple) * pow(abs(ripple), 0.5);

        // strong displacement that grows with fadeLevel
        float strength = fadeLevel * 0.16;

        vec2 dir = normalize(fragCoord - c);
        vec2 displaced = fragCoord + dir * ripple * strength;

        // soft clamp to avoid edge artifacts
        float edgeDist = min(displaced.x, min(displaced.y, min(1.0 - displaced.x, 1.0 - displaced.y)));
        float blend = smoothstep(0.0, 0.04, edgeDist);
        vec2 finalUV = mix(displaced, fragCoord, 1.0 - blend);

        fragColor = texture(oldBuffer, finalUV);
    }
}