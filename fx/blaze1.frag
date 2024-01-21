#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D inputC;
uniform float grayscaleFactor;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0
#define iChannel1 inputC


// The original Shadertoy version uses the black & white video as input.
// We apply a slight (randomized) desaturation to the primary shader because
// in most cases that makes the flame effect much stronger and more obvious.

vec4 generic_desaturate(vec3 color, float factor)
{
	vec3 lum = vec3(0.299, 0.587, 0.114);
	vec3 gray = vec3(dot(lum, color));
	return vec4(mix(color, gray, factor), 1.0);
}

void main()
{
    vec2 px = 4.0/vec2(640.0,360.0);
	vec2 uv = fragCoord.xy / iResolution.xy;

    vec4 grayscale = generic_desaturate(texture(iChannel0, uv).rgb, grayscaleFactor); 
    vec4 tex = pow(grayscale * 1.3, vec4(1.8));

    float d = 1.0-smoothstep(0.0,0.08,length(tex));
    //float d = abs(tex.g - newG);
    //tex.g = newG * 0.9;
    if (d > 0.0)
    {
        //px*= sin(iTime+uv.yx*3.0)*.35;
        uv -= 0.5*px;
        vec4 tex2 = texture(iChannel1,uv);
        uv += px;
        tex2 += texture(iChannel1,uv);
        uv.x -= px.x -.018 *sin(iTime*4.1+tex2.r);
        uv.y += px.y +.015 * cos(iTime*4.1+tex2.g);
        tex2 += texture(iChannel1,uv);
        uv.y -= px.y;
        tex2 += texture(iChannel1,uv);
        tex2 /= 4.013;
        tex2 = clamp(tex2*1.02-0.012,0.0,1.0);
        tex = max(clamp(tex*(1.0-d),0.0,1.0),mix(tex,tex2,smoothstep(-1.3,0.23,d)));
     }
        
	fragColor = tex;
}
