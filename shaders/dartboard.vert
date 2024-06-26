#version 450

layout (location = 0) in float vertexId;
uniform vec2 resolution;
uniform float vertexCount;
uniform float time;
uniform sampler2D eyecandyFreqDB;
out vec4 v_color;

#define PI radians(180.)

vec3 hsv2rgb(vec3 c);

mat4 rotY( float angle ) {
    float s = sin( angle );
    float c = cos( angle );
  	
    return mat4( 
      c, 0,-s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1);  
}

mat4 rotZ( float angle ) {
    float s = sin( angle );
    float c = cos( angle );
  	
    return mat4( 
      c,-s, 0, 0, 
      s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1); 
}

mat4 trans(vec3 trans) {
  return mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    trans, 1);
}

mat4 ident() {
  return mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
}

mat4 scale(vec3 s) {
  return mat4(
    s[0], 0, 0, 0,
    0, s[1], 0, 0,
    0, 0, s[2], 0,
    0, 0, 0, 1);
}

mat4 uniformScale(float s) {
  return mat4(
    s, 0, 0, 0,
    0, s, 0, 0,
    0, 0, s, 0,
    0, 0, 0, 1);
}

// hash function from https://www.shadertoy.com/view/4djSRW
float hash(float p) {
	vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
	return fract(p2.x * p2.y * 95.4337);
}

float m1p1(float v) {
  return v * 2. - 1.;
}

float p1m1(float v) {
  return v * 0.5 + 0.5;
}

float inv(float v) {
  return 1. - v;
}

#define NUM_EDGE_POINTS_PER_CIRCLE 48.
#define NUM_POINTS_PER_CIRCLE (NUM_EDGE_POINTS_PER_CIRCLE * 6.) 
void getCirclePoint(const float id, const float inner, const float start, const float end, out vec3 pos) {
  float outId = id - floor(id / 3.) * 2. - 1.;   // 0 1 2 3 4 5 6 7 8 .. 0 1 2, 1 2 3, 2 3 4
  float ux = floor(id / 6.) + mod(id, 2.);
  float vy = mod(floor(id / 2.) + floor(id / 3.), 2.); // change that 3. for cool fx
  float u = ux / NUM_EDGE_POINTS_PER_CIRCLE;
  float v = mix(inner, 1., vy);
  float a = mix(start, end, u) * PI * 2. + PI * 0.0;
  float s = sin(a);
  float c = cos(a);
  float x = c * v;
  float y = s * v;
  float z = 0.;
  pos = vec3(x, y, z);  
}

float goop(float t) {
  return sin(t) + sin(t * 0.27) + sin(t * 0.13) + sin(t * 0.73);
}

void main() {
  float circleId = floor(vertexId / NUM_POINTS_PER_CIRCLE);
  float pointId = mod(vertexId, NUM_POINTS_PER_CIRCLE);
  float sliceId = mod(floor(vertexId / 6.), 2.);
  float side = mix(-1., 1., step(0.5, mod(circleId, 2.)));
  float numCircles = floor(vertexCount / NUM_POINTS_PER_CIRCLE);
  float cu = circleId / numCircles;
  float pv = pointId / NUM_POINTS_PER_CIRCLE;
  vec3 pos;
  float inner = mix(0.1, 0.9, step(0.1, circleId)); //mix(0.2, 0.9, p1m1(sin(goop(circleId) + time * 0.0)));
  float start = 0.;//fract(hash(sideId * 0.33) + sin(time * 0.1 + sideId) * 1.1);
  float end   = 1.; //start + hash(sideId + 1.);
  getCirclePoint(pointId, inner, start, end, pos); 
  pos.z = 1.0 - cu;
  
  float snd = 0.0;
  const int numSamplers = 10;
  for (int i = 0; i < numSamplers; ++i) {
    snd += texture(eyecandyFreqDB, vec2(mix(0.005, 0.105, cu), float(i) * 0.002)).g * 1.5;
  }
  snd /= float(numSamplers);

  vec3 offset = vec3(hash(circleId) * 0.8, m1p1(hash(circleId * 0.37)), 0);
  offset.x += m1p1(pow(snd, 20.0) + goop(circleId + time * 0.) * 0.1);
  offset.y += goop(circleId + time * 0.) * 0.1;
  vec3 aspect = vec3(1, resolution.x / resolution.y, 1);
  
  mat4 mat = ident(); 
  mat *= scale(aspect);
//  mat *= trans(offset);
  mat *= rotZ(cu * 1.);//rotZ(snd * PI);
  mat *= uniformScale(pow(cu, 2.0)  + mix(0., 1., pow(snd, 5.0)) + sliceId * 0.01);
  gl_Position = vec4((mat * vec4(pos, 1)).xyz, 1);
  gl_PointSize = 4.;

  float hue = mix(0.6, 1.0, step(0.5, fract(cu * numCircles * 0.5)));
  hue = mix(0.165, hue, step(0.1, circleId));
  float sat = 1.;//1. -pow(snd, 5.);
  float val = mix(0.0, 0.0, fract(circleId * 0.79)) + sliceId ;
  v_color = vec4(hsv2rgb(vec3(hue, sat, val)), 1);
}