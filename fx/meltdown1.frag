#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

////////////////////////////////////////////////////////////////////////////
// For this FX, the color key defines the area NOT to mix from the primary
// visualization. The idea is that key areas are "allowed" to apply the
// effect without "interference" from large blank areas in the primary.
// Viz apollonian_twist.conf has all combinations as comments you can copy.
// For viz that covers the entire screen on every frame, sometimes just
// specifying option_frame=1 creates a cool "liquid 3D" sort of effect.

// mode:
// 0 - HSV, "value" must be above minvalue (good for viz without large solid colors)
// 1 - YCC, rgb1 specifies the color key
// 2 - OKLab, rgb1 is the color key, tolerance1 is applied
// 3 - OKLab, color keys rgb1 and rgb1, and tolerances are applied
uniform float option_mode = 0;

// debug: 1 uses white and/or black to identify color key matches, and
// it also forces the mix frame to 1 (minimizes "melting" effect)
uniform float option_debug = 0;

// frame: all modes, mix primary content every Nth frame
uniform float option_frame = 4.;

// factor: all modes except YCC, how much primary to mix in non-color-key areas
uniform float option_mixfactor = 0.15;

// value: HSV mode, pixel HSV "value" must be above this to mix the primary
uniform float option_minvalue = 0.1;

// rgb1: color key for YCC and OKLab modes (not normalized, use 0-255)
uniform float option_r1 = 128;
uniform float option_g1 = 128;
uniform float option_b1 = 128;

// rgb2: OKLab two-key mode (not normalized, use 0-255)
uniform float option_r2 = 128;
uniform float option_g2 = 128;
uniform float option_b2 = 128;

// tolerance: OKLab allowable color-similarity variances
uniform float option_tolerance1 = 0.05;
uniform float option_tolerance2 = 0.05;

// End visualizer options
////////////////////////////////////////////////////////////////////////////

int mix_frame = int((option_debug == 0) ? option_frame : 1.0);

#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution
#define fragCoord (fragCoord * resolution)
int iFrame = int(frame);

// library declarations for color_conversions.glsl
vec3 rgb2hsv(vec3 c);
vec4 chromakey_mix(vec3 fg, vec3 bg, vec3 key);
float color_difference(vec3 rgb1, vec3 rgb2);
vec4 desaturate(vec3 rgb, float factor);

#define C(x, y) textureLod(iChannel0, t * (fragCoord + float(1<<s) * vec2(x, y)), float(s))

void main()
{
    fragColor = vec4(0);
    vec2 t = 1.0 / iResolution.xy, q = fragCoord * t - 0.5;
    int s = 10;
    for (; s > 0; s--)
        fragColor.xy -= 
             2.0 * vec2(C(0, 1).x + C(0, -1).x, C(1, 0).y + C(-1, 0).y)
            -4.0 * C(0, 0).xy + (C(1, -1) - C(1, 1) - C(-1, -1) + C(-1, 1)).yx;
    
    fragColor = (C(fragColor.x, fragColor.y) + vec4(5e-4 * q / (dot(q, q) + 0.01), 0, 0));
    
    // mix in some new content every few frames
	if(iFrame % mix_frame == 0)
    {
        // primary is tested for the color-key match, non-key areas get mixed
        vec4 primary = texture(iChannel1, fragCoord * t);

        // fx is the "background" that is mixed with the primary in non-key areas
        vec4 fx = texture(iChannel0, fragCoord * t);

        // key colors for YCC and OKLab modes
        vec3 rgb1 = vec3(option_r1, option_g1, option_b1) / 255.0;
        vec3 rgb2 = vec3(option_r2, option_g2, option_b2) / 255.0;

        // HSV ... "value" below minvalue are unmixed key areas
        if(option_mode == 0)
        {
            vec3 hsv = rgb2hsv(primary.rgb);
            if(hsv.z > option_minvalue)
            {
                if(option_debug == 0)
                    fragColor = mix(fx, primary, option_mixfactor);

                if(option_debug == 1)
                    fragColor = vec4(1.0);
            }
            else if (option_debug == 1)
            {
                fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            }
        }

        // YCC ... very specific color match (best with tradional green key?)
        if(option_mode == 1)
        {
            if(option_debug == 0)
                fragColor = chromakey_mix(primary.rgb, fx.rgb, rgb1);

            if(option_debug == 1)
                fragColor = chromakey_mix(primary.rgb, vec3(0.0), rgb1);
        }

        // OKLab perceptual similarity, one rgb color key
        if(option_mode == 2)
        {
            float diff = color_difference(primary.rgb, rgb1);
            if(diff >= option_tolerance1)
            {
                if(option_debug == 0)
                    fragColor = mix(fx, primary, option_mixfactor);

                if(option_debug == 1)
                    fragColor = vec4(1.0);
            }
            else if (option_debug == 1)
            {
                fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            }
        }

        // OKLab perceptual similarity, two rgb color keys
        if(option_mode == 3)
        {
            float diff1 = color_difference(primary.rgb, rgb1);
            float diff2 = color_difference(primary.rgb, rgb2);
            if(diff1 >= option_tolerance1 || diff2 >= option_tolerance2)
            {
                if(option_debug == 0)
                    fragColor = mix(fx, primary, option_mixfactor);

                if(option_debug == 1)
                    fragColor = vec4(1.0);
            }
            else if (option_debug == 1)
            {
                fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            }
        }
    }
}
