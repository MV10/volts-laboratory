#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution

// mcguirev10 - original was pretty spazzy
#define iTime (time / (15.0 * sign(0.5 - randomrun)))

// --- Tweakable Parameters ---
#define ITERATIONS 100.0
#define ZOOM 1.8
#define ROTATION_SPEED 0.05
#define MOTION_SPEED 0.05
#define BRIGHTNESS 0.3

// A beautiful color palette function by Inigo Quilez.
// It creates a smooth, procedural color gradient.
vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

// Standard 2D rotation matrix function.
mat2 rotate2D(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void main() 
{
    // Normalize pixel coordinates, making them aspect-ratio correct and centered.
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // --- State Variables for the Loop ---
    vec2 p = uv;          // Position vector, starts as screen coordinates.
    vec2 n = vec2(0.0);   // Noise/feedback vector, accumulates distortion.
    float scale = ZOOM;   // Scale factor, grows each iteration.
    float pattern = 0.0;  // The accumulated brightness/pattern value.
    
    // Create a rotation matrix. Using iTime makes it animate.
    mat2 rotation = rotate2D(iTime * ROTATION_SPEED);

    // This is the core of the effect: a fractal feedback loop.
    for (float i = 0.0; i < ITERATIONS; i++) {
        // On each iteration, rotate the coordinate system and the feedback vector.
        p *= rotation;
        n *= rotation;

        // Generate a domain for this iteration.
        // It's a combination of the scaled position, the iteration count, and the feedback vector.
        vec2 q = p * scale + i + n;
        
        // Add a global, time-based motion to the whole pattern.
        q += sin(iTime * MOTION_SPEED) * tan(iTime * 0.5);

        // Accumulate the pattern. cos(q) creates waves.
        // Dividing by 'scale' makes higher-frequency details fainter.
        // The dot product is a simple way to combine the x and y components.
        pattern += dot(cos(q) / scale, vec2(BRIGHTNESS));

        // The feedback step: the current pattern distorts the 'n' vector for the next iteration.
        n -= sin(q);

        // Increase the scale for the next iteration to add finer details.
        scale *= 1.1;
    }

    // --- Final Coloring ---
    // Calculate the distance from the center for a vignette effect.
    float dist_from_center = length(uv);
    
    // The final color is determined by the generated pattern.
    // We add the time and distance to create a dynamic, evolving color field.
    vec3 color = palette(pattern + iTime * 0.1 - dist_from_center);

    // Apply a final brightness adjustment and the vignette.
    color *= (pattern + 0.8) - dist_from_center;

    // Output the final color to the screen.
    fragColor = vec4(color, 1.0);
}