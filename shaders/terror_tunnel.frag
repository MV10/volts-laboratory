#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iResolution resolution

void main()
{
    float i, e, R, s, t = iTime, o = 0.0;
    vec2 r = iResolution.xy;
    vec3 q, p;
    
    // Camera direction vector (d)
    vec3 d = vec3((fragCoord * 2.0 - r) / r.y * 1.5 + vec2(0.0, 1.0), 1.0);
    q = vec3(0.0, 0.0, 0.0);  // Camera origin
    q.zy -= 1.0;              // Offset Y and Z by -1 to adjust the starting point

    // Ray marching loop
    for(i = 0.0; i < 77.0; i++) {
        o += 0.011 - exp(-e * 2000.0) * 0.016;  // Accumulate brightness with decay
        s = 1.0;

        // Compute next sampling position (p) along the ray
        p = q += d * e * R * 0.2;
        R = length(p);  // Distance from origin
        p = vec3(
            log2(R) - t * 0.4,           // Compress distance and animate with time
            exp(-p.z / R),               // Depth-based attenuation
            atan(p.x, p.y) + t * 0.2     // Angular transformation with rotation
        );

        // Pseudo-fractal noise accumulation
        e = --p.y;  // Decrease y slightly and start accumulation
        for(s = 1.0; s < 1000.0; s += s) {
            e += abs(dot(sin(p.xxz * s), cos(p * s))) / s * 0.17;
        }
    }

    o = tanh(o);  // Tone mapping to compress bright values smoothly
    fragColor = vec4(vec3(o), 1.0);  // Output as grayscale color
}

