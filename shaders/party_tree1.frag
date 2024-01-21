#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input0

//-----------------USEFUL-----------------

#define PI 3.14159265359
#define E 2.7182818284
#define GR 1.61803398875

// mcguirev10: replaced the god-awful __LINE__ nonsense with random value 30; see: https://www.shadertoy.com/view/ttf3R4
#define time_calc ((saw(30.)*.125+.25)*(time+12345.12345))
#define saw(x) (acos(cos(x))/PI)


//-----------------RENDER-----------------

vec2 spiral(vec2 uv)
{
    float turns = 2.0;//+saw(time*1.1234)*4.0;
    float r = pow(log(length(uv)+1.), 1.175);
    float theta = atan(uv.y, uv.x)*turns-r*PI;
    return vec2(saw(r*PI+time), saw(theta));
}

void main()
{
    vec2 uv0 = fragCoord/iResolution.xy;
    vec4 sample0 = texture(iChannel0, uv0);
    
    vec2 uv = uv0;
    
    float scale = 2.0*PI;
    
    float variety = time;
    
    float len = sqrt(clamp(length(uv0*2.0-1.0), 0.0, 1.0));
    
    float recursion1 = clamp(saw(variety*PI)*3.0-1.0, 0.0, 1.0)*len;
    float recursion2 = clamp(saw(variety*PI)*3.0-1.0, 0.0, 1.0)*len;
    
    uv = ((spiral(scale*(spiral(scale*((uv)*2.0-1.0))*2.0-1.0))*2.0-1.0)*recursion1+(1.0-recursion1)*(uv*2.0-1.0))
        	*(1.0-recursion2)+recursion2*(saw(uv*PI*(5.0+sin(time_calc)*5.0))*2.0-1.0);
    
    vec2 direction = uv*iResolution.xy/60.0;
    
    vec4 sample1 = texture(iChannel0, uv0+direction/iResolution.xy*sample0.a);
    
    fragColor = (sample1)*sample0.a+sample0*(1.0-sample0.a);
    fragColor.rgb -= 5.0/255.0*sample0.a;
}
