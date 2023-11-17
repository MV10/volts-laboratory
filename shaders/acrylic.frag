#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define iResolution resolution
#define iTime time
#define iChannel0 eyecandyShadertoy

#define cor(a) (cos(a * 6.3 + vec3(0, 23, 21)) * .5 + .5)
#define wmod(p, w) mod(p, w) - w/2.

// arrrrgh I hate this "golfing" obfuscation nonsense...
#define o fragColor
vec2 u = (fragCoord * resolution);

void main() 
{
    vec2  r = iResolution.xy, p;
          u = (u - r.xy / 2.) / r.y;
          o *= 0.;
    
    float i, a, d, t = iTime;
    
    t += texture(iChannel0, vec2(0.05, 0.5)).g * (0.5 + randomrun);
    
    while(i++ < 69.) 
        p = a * u,
        p = vec2(
                cos(
                    wmod(
                        atan(p.y, p.x) 
                            + cos(i) * .05 
                            + cos(a * .05 + t * .55) 
                            + t * .25, 
                        3.14 / (2.5 + floor(cos(a * .025 + t * .25) * 2.) / 2.) 
                    )  
                ) * length(p.xy) - 4., 
                wmod(a * .5 + t * 2.5, 1.2)
            ),
        
        a += d = abs(length(p) - .2) - .001,
        
        o.rgb += exp(-d * 5.) * cor(a + t * .25) * .03;
}