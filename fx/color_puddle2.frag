#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0
#define iChannel1 input1

float getVal(vec2 uv)
{
    return length(texture(iChannel1,uv).xyz);
}
    
vec2 getGrad(vec2 uv,float delta)
{
    vec2 d=vec2(delta,0);
    return vec2(
        getVal(uv+d.xy)-getVal(uv-d.xy),
        getVal(uv+d.yx)-getVal(uv-d.yx)
    )/delta;
}

#define PI 3.141592
mat2 rotationMatrix(float angle)
{
	angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, -s, 
                 s,  c );
}

void main() {
    vec2 aspect = vec2(1.0, (iResolution.y / iResolution.x));
    
    vec2 uv = fragCoord/iResolution.xy;

    // mcguirev10 - rotation is fun
    vec2 offset_uv = uv * rotationMatrix(time * (randomrun - 0.5) * 30.0);

    vec3 off = texture(iChannel1, offset_uv).xyz;
    off *= 0.05;
   
    float dist = length((uv.xy - vec2(0.5, 0.5)) * aspect);

    // mcguirev10 - vary the radius (original 0.2-0.25, min is 0.15, max is 0.6)
    float radius = 0.15 + (abs(sin(time * 0.2)) * 0.5);

    vec3 mask = vec3(1.0) - smoothstep(0.1, radius, dist);
    off *= mask;

    fragColor = texture(iChannel0, uv + off.xy);
    fragColor.xyz += off * getVal(uv + off.xy) *8. ;
}
