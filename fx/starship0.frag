#version 450
precision highp float;

// Adapted from unpublished Grok code
// https://www.shadertoy.com/view/wfSyRm

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D noise;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

// Smooth noise function for continuous viewpoint modulation
vec2 smoothNoise(vec2 uv, float time) {
    vec2 noiseVal = texture(noise, uv * 0.02 + time * 0.05).xy; // Very low frequency for ultra-smooth variation
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
    return offset * 0.4; // Adjusted for viewport coverage
}

// Ray-plane intersection for a simpler concave surface approximation
float rayPlaneIntersect(vec3 ro, vec3 rd, vec3 planeNormal, vec3 planePoint) {
    float denom = dot(rd, planeNormal);
    if (abs(denom) < 1e-6) return -1.0; // Ray parallel to plane
    float t = dot(planePoint - ro, planeNormal) / denom;
    if (t < 0.0) return -1.0; // Intersection behind camera
    return t;
}

void main()
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;
    
    // Viewport aspect ratio
    float aspect = iResolution.x / iResolution.y;
    
    // Camera setup with wandering viewpoint
    vec2 wander = wanderOffset(iTime * 1.25); // Increased motion speed
    vec3 ro = vec3(wander * 0.5 * aspect, 0.8); // Camera closer, z = 0.8, x adjusted for aspect
    vec3 lookAt = vec3(wander * 0.5 * aspect, 0.0); // Look at center with wander offset
    vec3 up = vec3(0.0, 1.0, 0.0);
    
    // Camera direction
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(cross(forward, up));
    up = cross(right, forward);
    
    // Ray direction for current pixel
    vec2 p = (uv - vec2(0.5)) * vec2(aspect, 1.0) * 2.0; // Map to [-aspect, aspect] x [-1, 1]
    vec3 rd = normalize(p.x * right + p.y * up + forward * 0.7); // Narrow FOV
    
    // Concave surface approximated as a plane with curvature in UV mapping
    vec3 planePoint = vec3(0.0, 0.0, 0.0);
    vec3 planeNormal = vec3(0.0, 0.0, 1.0); // Plane facing camera
    
    // Ray-plane intersection
    float t = rayPlaneIntersect(ro, rd, planeNormal, planePoint);
    
    if (t > 0.0) {
        // Intersection point
        vec3 pos = ro + t * rd;
        
        // Simulate concave surface by warping UVs
        vec2 texUV = pos.xy / vec2(aspect, 1.0); // Adjust for viewport aspect ratio
        float dist = length(texUV);
        // Apply gentle curvature for concave effect
        texUV *= 1.0 + 0.2 * dist * dist; // Quadratic warping
        
        // Map to texture coordinates [0, 1], scaled to extend beyond viewport
        texUV = texUV * 0.2 + 0.5; // Further reduced scaling for larger image
        
        // Ensure texture coordinates are within bounds
        if (texUV.x >= 0.0 && texUV.x <= 1.0 && texUV.y >= 0.0 && texUV.y <= 1.0) {
            // Sample texture from iChannel0
            vec3 col = texture(input0, texUV).rgb;
            
            // Simple shading for concave effect
            float lighting = max(0.0, 1.0 - 0.1 * dist); // Subtle falloff
            col *= 0.7 + 0.3 * lighting;
            
            fragColor = vec4(col, 1.0);
        } else {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black outside texture bounds
        }
    } else {
        // Background color if no intersection
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }}

