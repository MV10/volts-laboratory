#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iChannel0 input0
#define iChannel1 inputB
#define iResolution resolution

float light(in vec4 c) {
	return (c.r + c.g + c.b) / 3.0;
}

vec2 vector(in float r, in float d) {
	return vec2(cos(r), sin(r)) * d;
}

vec3 hueShift(vec3 col, float shift){
    vec3 m = vec3(cos(shift), -sin(shift) * .57735, 0);
    m = vec3(m.xy, -m.y) + (1. - m.x) * .33333;
    return mat3(m, m.zxy, m.yzx) * col;
}

void main()
{        
    float DISTANCE = 2.0;
    int RAY = 8;
    float LAG_VECTOR = 0.97;
    
    vec2 sum = vec2(0, 0);
    
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    for (int i = 0; i < RAY; i++) {
        vec2 offset = vector(float(i) / float(RAY) * 3.14159 * 2.0, DISTANCE);
        vec2 uvo = 
            (
                fragCoord 
                + offset
            )
            / iResolution.xy;
        
        sum = sum + normalize(offset) * light(texture(iChannel0, uvo));
    }
    
    sum = sum * 16.0 / float(RAY);
    
    float strength = length(sum);
    float direction = atan(sum.y, sum.x);
    fragColor = 
        vec4(hueShift(vec3(strength, 0.0, 0.0), direction), 1.0) * (1.0 - LAG_VECTOR / 1.1)
        + texture(iChannel1, uv + vec2(1.0, 0.0) / iResolution.xy) * LAG_VECTOR * 0.25
        + texture(iChannel1, uv + vec2(0.0, 1.0) / iResolution.xy) * LAG_VECTOR * 0.25
        + texture(iChannel1, uv + vec2(-1.0, 0.0) / iResolution.xy) * LAG_VECTOR * 0.25
        + texture(iChannel1, uv + vec2(0.0, -1.0) / iResolution.xy) * LAG_VECTOR * 0.25;
    // Output to screen
}