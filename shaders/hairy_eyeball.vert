#version 450

layout (location = 0) in float vertexId;
uniform vec2 resolution;
uniform float vertexCount;
uniform float time;
uniform sampler2D eyecandyWebAudio;
out vec4 v_color;

#define PI radians(180.)

vec3 hsv2rgb(vec3 c);

float hash(float p) {
	vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
	return fract(p2.x * p2.y * 95.4337);
}


void main() {
  float pointsAroundCircle = 240.;
  float pointsPerCircle = pointsAroundCircle * 2.;
  float numCircles = floor(vertexCount / pointsPerCircle);
  float circleId = floor(vertexId / pointsPerCircle);
  float vId = mod(vertexId, pointsPerCircle);
  float pointId = floor(vId / 2.) + mod(vId, 2.);
  float pointV = pointId / (pointsAroundCircle - 1.);
  
  float circleV = circleId / (numCircles - 1.);
  float odd = mod(circleId, 2.);
  float quad = mod(floor(circleId / 2.), 2.);
  
  float tm = time * 4. - circleV;
  float angle = mix(-PI, PI, pointV) + sin(tm + pointV * PI * 8.) * .5;
  float c = cos(angle);
  float s = sin(angle);
  
  vec2 aspect = vec2(1, resolution.x / resolution.y);
  float off = mix(.0, 0.953, circleV);

  float su = hash(pointV * 13.7);
  float snd = texture(eyecandyWebAudio, vec2(mix(0.001, 0.115, su), circleV * 0.5)).g;
    
  float q = (odd + quad * 2.) / 3.;
  float sq = texture(eyecandyWebAudio, vec2(mix(0.001, 0.115, 0.), 0)).g * 1.25;
  
  vec2 xy = vec2(c, s) * mix(1. , 1. + off, pow(snd, 17.)/sq);
  float scale = mix(
     mix(
       mix(.04, .25, circleV),
       mix(-.4, snd/0.7, circleV),
       odd),
     mix(
       mix(.1, -.15+snd, circleV),
       mix(-.1, -.05, circleV),
       odd),
     quad) + pow(sq, 2.) * .3;
  
  gl_Position = vec4(xy * aspect * scale, circleV, 1);

  float hue = 0.5 + odd * .25 + quad * .125;
  v_color = vec4(hsv2rgb(vec3(hue, 1, 1)), 1. - circleV);
  v_color.rgb *= v_color.a;
}
