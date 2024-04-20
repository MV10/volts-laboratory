#version 450

layout (location = 0) in float vertexId;
uniform vec2 resolution;
uniform float vertexCount;
uniform float time;
uniform sampler2D eyecandyWebAudio;
out vec4 v_color;

#define PI 3.14159
#define NUM_SEGMENTS 10.0
#define NUM_POINTS (NUM_SEGMENTS * 12.0)
#define STEP 5.0

vec3 hsv2rgb(vec3 c);

void main() {
  float localTime = time + 20.0;
  float point = mod(floor(vertexId / 2.0) + mod(vertexId, 2.0) * STEP, NUM_SEGMENTS);
  float count = floor(vertexId / NUM_POINTS);
  float snd = texture2D(eyecandyWebAudio, vec2(fract(count / 128.0), fract(count / 20000.0))).g;
  float offset = count * 0.02;
  float angle = point * PI * 2.0 / NUM_SEGMENTS + offset;
  float radius = 0.21 * pow(snd, 5.0);
  float c = cos(angle + localTime) * radius;
  float s = sin(angle + localTime) * radius;
  float orbitAngle =  count * 0.0;
  float innerRadius = count * 0.001;
  float oC = cos(orbitAngle + localTime * 0.4 + count * 0.1) * innerRadius;
  float oS = sin(orbitAngle + localTime + count * 0.1) * innerRadius;

  vec2 aspect = vec2(1, resolution.x / resolution.y);

  vec2 xy = vec2(oC + c, oS + s);
  gl_Position = vec4(xy * aspect * 0.9, 0, 1);

  float hue = (localTime * 0.01 + count * 1.001);
  v_color = vec4(hsv2rgb(vec3(hue, 1, 1)), 1);
}