#version 320 es

layout (location = 0) in float vertexId;
uniform vec2 resolution;
uniform float vertexCount;
uniform float time;
uniform sampler2D sound;
out vec4 v_color;

// Remember to use the GREEN channel on audio textures (VertexShaderArt uses Alpha channel)
// Change texture2D commands to the newer overloaded texture command

void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 5.0;
  v_color = vec4(1.0, 0.0, 0.0, 1.0);
}
