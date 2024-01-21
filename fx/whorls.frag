#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution

#define TAU 2.0

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec2 pos2uv(vec2 pos) {
  return (pos / 2.0 * min(iResolution.x, iResolution.y) + iResolution.xy / 2.0) / iResolution.xy;
}

void main()
{
    float s = sin(iTime * TAU / 10.0);
    float c = cos(iTime * TAU / 10.0);
    mat2 transform = mat2(c, -s, s, c) * 1.1;
    
    vec2 pos = (fragCoord.xy - iResolution.xy / 2.0) / min(iResolution.x, iResolution.y) * 2.0;
    if(
        fragCoord.x != clamp(fragCoord.x, 10.0, iResolution.x - 10.0)
        || fragCoord.y != clamp(fragCoord.y, 10.0, iResolution.y - 10.0)
    ) {
      fragColor = texture(iChannel1, pos);
    } else {
      vec2 t = pos2uv(pos * transform + vec2(sin(iTime), cos(iTime*1.127)) * 0.5);
      fragColor =
          texture(iChannel0, fragCoord / iResolution.xy) * 0.01
          + texture(iChannel0, t) * rotationMatrix(vec3(1.0), TAU/4.0) * 0.99;
    }
}