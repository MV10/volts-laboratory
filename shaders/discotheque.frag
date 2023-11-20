#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define I (fragCoord * resolution)
#define O fragColor
#define iTime time
#define iResolution resolution
#define iChannel0 eyecandyShadertoy

#define o fragColor

#define S smoothstep
const float NUM_LINES = 40.;

vec4 Line(float vu0, float t, vec2 uv, float speed, float height, vec3 col) 
{
    float ti = 1. - t;
    float vu = ((texture( iChannel0, vec2(ti, .25)).g )) * ti;
    
    float b = S(1., 0., abs(uv.x)) * sin(iTime * speed + uv.x * height * t) * .2;
    uv.y += b*2. * (vu0 *1. + 0.3);    

    uv.x += vu * 12. - 2.;
        
    return vec4(S(.06 * S(.2, .9, abs(uv.x)), 0., abs(uv.y) - .004) * col, 1.0) * S(1., .3, abs(uv.x));
}

void main() 
{
    vec2 uv = (I - .5 * iResolution.xy) / iResolution.y;
    O = vec4 (0.);

    float vu0 = (texture( iChannel0, vec2(0.1,  0.25)).g  +
                   texture( iChannel0, vec2(0.2, 0.25)).g +
                   texture( iChannel0, vec2(0.4, 0.25)).g +
                   texture( iChannel0, vec2(0.6, 0.25)).g +
                   texture( iChannel0, vec2(0.7, 0.25)).g +
                   texture( iChannel0, vec2(0.9, 0.25)).g ) / 6.;

    for (float i = 0.; i <= NUM_LINES; i += 1.) {
        float t = i / NUM_LINES;

        float c = (vu0 - t) + .3;
        
        O += Line(vu0, t, uv, 1. + t, 4. + t, vec3(.2 + c * .7, .2 + c * .4, 0.3)) * 2.;
    }
}
