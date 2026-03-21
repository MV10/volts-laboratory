#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
out vec4 fragColor;

// time multipler 1 or -1 but avoid 0 from sign(r - 0.5)
float direction = step(0.5, randomrun) * 2.0 - 1.0;

#define iResolution resolution
#define iTime (time * direction)

// arrrrgh I hate this "golfing" obfuscation nonsense...
#define O fragColor
#define I (fragCoord * resolution)

void main()
{
    vec2 r = iResolution.xy;
    vec4 o = vec4(0.0);
    
    float i = 0.0, e, R, s;
    vec3 q, p, d = vec3((-I.yx / r * 0.9 + vec2(0.25, 1.5)), 1.0);
    
    for(q.zy = vec2(-1.0); i < 110.0; i++) {
        // Add color based on densit
        o.rgb += 0.01 - exp(-e * 400.0) * 0.025 * vec3(4.9,0.6,0.5);
        
        s = 4.0;
        p = q += d * e * R * 0.09;
        
        // Transform to cylindrical coordinates
        R = length(p);
        p = vec3(log(R) - iTime * 0.5, exp(-p.x / R - p.z / R), atan(p.x - 0.4, p.y));
        
        // Start with the transformed y component
        e = --p.y;
        
        // Apply the mathematical series expansion
        for(s = 4.0; s < 200.0; s += s) {
            e += dot(sin(p.zx * s), cos(p.xx * s + iTime)) / s;
        }
    }
    
    O = o;
    O.a = 1.0;
}
