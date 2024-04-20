#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D iChannel0;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution vec3(resolution, 1.0)
#define iTime time
#define iChannel1 eyecandyShadertoy

#define MAX_STEPS 55.
#define MAX_DIST 3.
#define BEAM_LENGTH 2.
#define PRECISION 0.001

// Camera position (ray origin) sorta working but it skews the geometry
float roX = 0., roY = 0., roZ = 0.;

// Fun values - roughly normalized 0 to 1 (could be cool to vary these by time or sound/mouse input)
float timeScale = 0.33;     // Scales 'Ts'
float softenAmt = 0.22;     // Godray 'un-focus' effect
//float rayTaper = -0.13;     // Positive values taper inward, negative values spread out
float colorShift = 0.13;    // Effect of ray distance 't' on palette index offset
float colorSpeed = 0.42;    // Speed of cycle through palette (fraction of 'Ts')
float holeSpacing = 0.5;

#define holeSize (holeSpacing / 6.)
#define RAY_WIDTH 0.17
#define BALL_SIZE 1.

#define ZOOM 1.
#define BACKGROUND .00001

// Tuning (0-1)
#define CONTRAST 1.0
#define INTENSITY 1.0
#define NOISE_AMT 0.4

// Color palette - generate values here: http://erkaman.github.io/glsl-cos-palette/
#define PALETTE(t) cosPalette(t,vec3(0.52,0.17,0.41),vec3(0.57,0.72,0.75),vec3(0.96,0.32,0.84),vec3(0.55,0.11,0.26))

// Palette function
vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b * cos(6.28318 * (c * t + d) ); }

// Macros
#define pi 3.14159265358979323846
#define Ts iTime * timeScale
#define sinT(freq) float (sin(Ts * pi * freq) * 0.5) + 0.5 //Normalized sin of 'Ts'
#define M(p) p *= mat2(cos(round((atan( p.x, p.y ) + Ts) / holeSpacing) * holeSpacing - Ts + vec4(0, 33, 11, 0) ) );
#define S(a, b, t) smoothstep(a, b, t)

void main() 
{
    float fft = texture(iChannel1, vec2(0.1, 0.25)).g;
    float rayTaper = 2.0 - (4.0 * fft);

    vec4 col;
    vec2 R = iResolution.xy;
    vec2 uv = (fragCoord - R / 2. ) / R.y;
    vec3 ro = vec3(roX, roY, roZ); // ray origin ('camera' position)
    vec3 rd = normalize(vec3(uv, (.5 * ZOOM))); // ray direction, one per uv coord
    float d = PRECISION; // starting value of 'd' must be >= 'PRECISION', seems not to matter otherwise...
    float t, l, i;

    for( fragColor *= i; i++ < MAX_STEPS;
        t -= d  = min( max(l, -d ),
                    0.025 / INTENSITY + texture(iChannel0, fragCoord / 256. ).r * NOISE_AMT / 10. ) )
    {
        vec3 p = ro + rd * t;
        p = t / length(p ) * p - (2. / iResolution);

        // Matrix rotation (macro)
        M( p.zx )
        M( p.yx )
        
        if (d < PRECISION || length(p) > MAX_DIST) break;   // Break loop if too close or too far

        // Set Color
        //col.rgb = fragColor.rgb;      // Neat bug with this uncommented
        vec3 palette = PALETTE( sinT(colorSpeed) - t * colorShift );
        col.rgb +=  palette * S( 1., 0., (d = length(p.yz ) - holeSize )
                                / (softenAmt / 8.) + (0.15 / RAY_WIDTH) + (5. * rayTaper * l) )
                  * palette * S( BEAM_LENGTH, 0., l = length(p) - (1. * BALL_SIZE) ) + BACKGROUND;
    }

    col.rgb *= exp(t * (CONTRAST * 0.5));
    col.a = 1.0;
    fragColor = vec4(pow(col.rgb,vec3(1. / 2.2)), col.a);   // Gamma
}