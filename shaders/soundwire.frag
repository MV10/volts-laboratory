#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 eyecandyShadertoy
#define iTime time

float rand(vec2 n) 
{
    return fract(sin(dot(n, vec2(12.9898,12.1414))) * 83758.5453);
}

float noise(vec2 n) 
{
    const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n);
    vec2 f = mix(vec2(0.0), vec2(1.0), fract(n));
    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

vec3 ramp(float t) 
{
	return t <= .5 ? vec3( 1. - t * 1.4, .2, 1.05 ) / t : vec3( .3 * (1. - t) * 2., .2, 1.05 ) / t;
}

float fire(vec2 n) 
{
    return noise(n) + noise(n * 2.1) * .6 + noise(n * 5.4) * .42;
}

void main()
{
    float t = iTime;
    vec2 uv = fragCoord / iResolution.y;
    
    float f = 1. * texture(iChannel0, vec2(.5*uv.x, .75)).g;  
    uv.y = abs(uv.y - f);
    uv *= 5.0;
    
    float q = fire(vec2(uv.x - t * .013, uv.y  + f - t * .013)) / 2.0;
 
    vec2 r = vec2(fire(vec2(uv.x + q / 2.0 + t - uv.x - uv.y, uv.y + q / 2.0 + t - uv.x - uv.y - f)), fire(vec2(uv.x + q - t, uv.y + q - t - f))) ;
   
    vec3 color = vec3(1.0 / (pow(vec3(0.5, 0.0, .05) + 1.61, vec3(4.0))));
         
    float grad = pow((r.y + r.y + f) * max(.0, uv.y) + .05, 1.3);

    color = ramp(grad);
    color /= (1.50 + max(vec3(0), color));

    fragColor = vec4(color, 1.0);
}
