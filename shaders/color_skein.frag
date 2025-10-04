#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define iResolution resolution
#define iTime time

// arrrrgh I hate this "golfing" obfuscation nonsense...
#define o fragColor
#define u (fragCoord * resolution)

const float pi_deg = 3.141592 / 180.0;
#define rotationMatrix(angle) mat2(cos(angle*pi_deg),-sin(angle*pi_deg),sin(angle*pi_deg),cos(angle*pi_deg))

void main()
{
    // Time and resolution
    float i, d = 0.0, s = 0.0, n;
    float t = -iTime;
    vec3 p;
    vec3 r = vec3(resolution, 0); // what???

    // Convert pixel coordinates to normalized space [-1, 1]
    vec2 uv = (u - r.xy * 0.5) / r.y;

    // mcguirev10 - spinny
    uv *= rotationMatrix(iTime * 1.0 * (randomrun - 0.5) + (4.0 * sign(randomrun - 0.5)));

    // Initialize output color
    o = vec4(0.0);

    // Raymarching loop: 80 steps
    for (i = 0.0; i++ < 120.0;) {
        // Marching step with slight nonlinear scaling
        s = 0.006 + abs(s) * 0.3;
        d += s;

        // Add sin-based color accumulation (fog/glow effect)
        o += sin(d  +vec4(0.3, 0.9, 0.5+ p.z, 0.0)) / (abs(s) + 1e-4);

        // mcguirev10 - add a little more based on the sound
        o += (texture(eyecandyShadertoy, vec2(0.2, 0.25)).g 
            + texture(eyecandyShadertoy, vec2(0.5, 0.25)).g
            + texture(eyecandyShadertoy, vec2(0.8, 0.25)).g) * 4.0;

        // Ray position in space
        // mcguirev10 - and jiggle with the audio
        p = vec3(uv * d, d + iTime) 
            + ((texture(eyecandyShadertoy, vec2(0.7, 0.25)).g - 0.5) * 0.5);

        // Symmetric space folding and oscillatory deformation
        //p = 0.55 - abs(abs(p) - (cos(iTime * 0.01 + 2.0) + sin(iTime * 0.05) * 0.5));
        p.xy *= mat2(
            cos(0.02 * t + p.z * 0.2), sin(0.02 * t + p.z * 0.2),
           -sin(0.02 * t + p.z * 0.2), cos(0.02 * t + p.z * 0.2)
        );

        // Base warping field
        s = sin(2.0 + p.y + p.x);

        // Pseudo-fractal detail via nested sin(dot) layers
        for (n = 2.0; n <= 20.0; n *= 2.0) {
            vec3 freq = p * n;

            // Time-varying weights per axis
            vec3 timeMod = vec3(
                0.8,
                2.5 + sin(iTime * 0.25) * 0.2,
                1.5 + sin(iTime * 0.1) * 0.5
            );

            s -= abs(dot(0.2 * sin(freq), timeMod)) / n;
        }
    }

    // Tone mapping and gamma correction
    o = pow(tanh(o * o / 2.5e7), vec4(0.4545));
    o.a = 1.0;
}
