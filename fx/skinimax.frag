#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input1;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input1
#define iChannel1 eyecandyShadertoy

#define PI 3.1415

void main()
{
    float blur_samples = 10 + (10.0 * randomrun);
    float amp = texture(iChannel1, vec2(0.1, 0.25)).g * randomrun;

    vec2 uv = fragCoord/iResolution.xy;

    vec4 tex = texture(iChannel0, uv);
    vec4 edge = vec4(0);
    for(float x = -1.0; x < 2.0; x++)
    {
        for(float y = -1.0; y < 2.0; y++)
        {
            if(x != 0.0 && y != 0.0)
            {
                vec2 pos = (fragCoord + vec2(x, y))  / iResolution.xy;
                edge += abs(tex - texture(iChannel0, pos));
            }
        }
    }
    edge /= 8.0;

    vec3 finalCol = vec3(0.0);
    
    for (float i = 0; i < 3; i++) {
        int idx = int(i);
    	float effectAmp = amp * (edge[idx] + .1);
    	float angle = iTime + i + uv.y - uv.x * tan(effectAmp * uv.y);
    
    	vec3 col = vec3(0.0);
    	for (float i = -2; i < blur_samples; i++) {
        	float blurAmp = effectAmp * (i / blur_samples);
        	//blurAmp *= float(iFrame % 2) - .5;
        
        	col = mix(col, texture(iChannel0, uv + vec2(blurAmp * cos(angle), blurAmp * sin(angle))).rgb, i / blur_samples);
    	}
        
    	finalCol[idx] = col[idx];
    }
    
    fragColor = vec4(finalCol, 1.0);
}
