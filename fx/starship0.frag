#version 450
precision highp float;

// Adapted from unpublished Grok code
// https://www.shadertoy.com/view/wfjyWR

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D noise;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

#define INPUT0_SCALE 0.7

// Smooth noise function for continuous viewpoint modulation
vec2 smoothNoise(vec2 uv, float time) {
    vec2 noiseVal = texture(noise, uv * 0.02 + time * 0.05).xy; // Low frequency for smooth variation
    return noiseVal * 2.0 - 1.0; // Map to [-1, 1]
}

// Cubic Hermite interpolation for smoother transitions
float hermite(float t) {
    return t * t * (3.0 - 2.0 * t); // Smoothstep-like cubic interpolation
}

vec2 interpolateNoise(vec2 uv, float time) {
    float t = fract(time);
    float tSmooth = hermite(t); // Smooth interpolation
    vec2 n0 = smoothNoise(uv, floor(time));
    vec2 n1 = smoothNoise(uv, floor(time) + 1.0);
    return mix(n0, n1, tSmooth); // Interpolate between noise samples
}

// Function to create smooth, spline-like motion with varying radii
vec2 wanderOffset(float time) {
    vec2 uv = vec2(0.3, 0.7); // Base UV for noise sampling
    
    // Base circular/elliptical motion
    float angle = time * 0.3; // Adjusted speed for arc traversal
    vec2 basePos = vec2(cos(angle), sin(angle)); // Circular path
    
    // Modulate radius and phase using interpolated noise for smooth arcs
    float radiusMod = interpolateNoise(uv, time * 0.1).x * 0.3 + 1.0; // Vary radius between 0.7 and 1.3
    float phaseMod = interpolateNoise(uv + vec2(0.1, 0.2), time * 0.05).y * 0.15; // Subtle phase shift
    
    // Combine base motion with modulated radius and elliptical shape
    vec2 offset = basePos * radiusMod * vec2(1.0, 0.6); // Elliptical scaling for varied loops
    offset += interpolateNoise(uv + vec2(0.3, 0.4), time * 0.03) * 0.08; // Small noise for organic drift
    
    // Scale to ensure good coverage without reaching image edges
    return offset * 0.1; // Reduced scale for UV offset
}
void main()
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;
    
    // Compute wandering offset
    vec2 wander = wanderOffset(iTime * 1.25); // Increased motion speed
    
    // Apply offset to texture coordinates, centered and scaled to extend beyond viewport
    vec2 texUV = (uv - vec2(0.5)) * INPUT0_SCALE + 0.5; // Scale to enlarge image
    texUV += wander; // Apply wander offset directly
    
    // Compute vignette effect (1% of viewport width/height)
    float vignette = 1.0;
    float edgeDist = 0.01; // 1% of viewport for fade
    vignette *= smoothstep(0.0, edgeDist, texUV.x); // Left edge
    vignette *= smoothstep(0.0, edgeDist, 1.0 - texUV.x); // Right edge
    vignette *= smoothstep(0.0, edgeDist, texUV.y); // Bottom edge
    vignette *= smoothstep(0.0, edgeDist, 1.0 - texUV.y); // Top edge
    
    // Sample texture from iChannel0
    vec3 col = texture(input0, texUV).rgb;
    
    // Apply vignette effect
    col *= vignette;
    
    fragColor = vec4(col, 1.0);
}

