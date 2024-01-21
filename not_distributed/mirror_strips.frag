#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel0 input0
#define iResolution resolution

float map(float low1, float high1, float low2, float high2, float value){
	value = max(value, low1);
	value = min(value, high1);
	return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
	
    // num columns
    float cols = 16. + 8.*cos(iTime);
	
   	// steps
	float qx = floor(uv.x * cols) / cols;
    
    // texture calculation
    float fx = mod(2. - map(qx, qx + 1.0/cols, qx + 1.0/cols, qx, uv.x),1.);
    
    fragColor = texture(iChannel0, vec2(fx,uv.y));
}

