#version 460

layout (location = 0) in float vertexId;
uniform vec2 resolution;
uniform float vertexCount;
uniform float time;
uniform sampler2D eyecandyWebAudio;
out vec4 v_color;

#define W 128.0
#define H 64.0
#define PI 3.1415926535

vec3 hsv2rgb(vec3 c);

void main() {
  float fv = floor(vertexId / W);
  float fu = vertexId - fv * W;
  fu /= W;
  fv /= H;
  float u = fu * 2.0 * PI;
  float v = fv * 2.0 * PI;
  u += time;
  
  float sin_u = sin(u);
  float cos_u = cos(u);
  float sin_v = sin(v);
  float cos_v = cos(v);
  float f = texture(eyecandyWebAudio, vec2(abs(fu - 0.5) + 0.1, fv * 0.1)).g + 0.05;
  vec3 p = vec3(cos_u * (cos_v * f + 1.0), sin_u * (cos_v * f + 1.0), sin_v * f);
  float sin_t = sin(time);
  float cos_t = cos(time);
  p *= mat3(cos_t, 0, sin_t, 0, 1, 0, -sin_t, 0, cos_t);
  sin_t = sin(time * 0.7);
  cos_t = cos(time * 0.7);
  p *= mat3(cos_t, sin_t, 0, -sin_t, cos_t, 0, 0, 0, 1);
  p.x *= resolution.y / resolution.x;
  p.z += 3.0;
  p.xy *= 3.0 / p.z;
  gl_Position = vec4(p.x, p.y, 1.0, p.z);

  v_color = vec4(hsv2rgb(vec3(fu * 3.0, 1.0, 1.0)), 1);
}
