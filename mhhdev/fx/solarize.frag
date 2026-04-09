#version 450
precision highp float;

in vec2 fragCoord;
uniform sampler2D input0;
uniform sampler2D solar;
uniform float time;
uniform vec2 resolution;
out vec4 fragColor;

void main()
{
    vec2 uv = fragCoord;

    // Sample the main full-screen image
    vec4 base = texture(input0, uv);

    // Center in normalized screen space
    vec2 center = uv - 0.5;

    // Rotation in isotropic (square) space
    float angle = time * 0.08;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);

    // Rotate the sampling offset
    vec2 solarUV = rot * center;
    solarUV += 0.5;

    // Gentle zoom (isotropic)
    solarUV = (solarUV - 0.5) * 1.04 + 0.5;

    // Gentle ripple (direction rotated to stay consistent)
    float ripple = sin(length(uv - 0.5) * 14.0 - time * 3.2) * 0.007;
    solarUV += ripple * (rot * normalize(center + vec2(0.001)));

    // Fit square solar texture without stretching or distortion during rotation
    float screenAspect = resolution.x / resolution.y;
    float fitScale = min(screenAspect, 1.0 / screenAspect);

    // Apply the isotropic scale after all transformations
    solarUV = (solarUV - 0.5) * fitScale + 0.5;

    // Sample the solar texture
    vec4 sun = texture(solar, solarUV);

    // Luminance for brightness detection - made less aggressive
    float lum = dot(sun.rgb, vec3(0.299, 0.587, 0.114));

    // Vignette mask for clean circular solar disk
    float dist = length(solarUV - 0.5);
    float vignette = 1.0 - smoothstep(0.37, 0.56, dist);

    // Transparency: less aggressive threshold so more interior colors of the Sun are kept
    float alpha = vignette * smoothstep(0.04, 0.16, lum);

    // Text suppression in transformed solarUV space (single optimized test)
    if (solarUV.x < 0.5 && solarUV.y < 0.07) {
        alpha = 0.0;
    }

    // Final composite - favor the base image more (solar is now a subtle effect)
    vec3 color = mix(base.rgb, sun.rgb, alpha * 0.55);

    fragColor = vec4(color, 1.0);
}
