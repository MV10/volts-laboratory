#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

void main()
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    //uv.y *= 0.6;
    //uv.y += 0.4;
    uv.x = 1.0 - uv.x;
    
    vec3 col = vec3(0.0);
    vec2 off = 1.0 / iResolution.xy;
    for (float i=-1.0; i<=1.0; i++) 
    {
    	for (float j=-1.0; j<=1.0; j++)
        {
    		 col = texture(iChannel0, uv + vec2(i, j) * off).rgb;
        }
    }
    
    fragColor = vec4(col / 2.0, 1.0);
}
