#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)

#define RESOLUTION  resolution
#define TIME        time

#define PI          3.141592654
#define TAU         (2.0*PI)
#define ROT(a)      mat2(cos(a), sin(a), -sin(a), cos(a))
#define NORM_OFF    0.001

const int   max_iter      = 90;
const float fixed_radius2 = 1.8;
const float min_radius2   = 0.5;
const vec4  folding_limit = vec4(1.0);
const float scale         = -2.9-0.2;

mat3 g_rot;
float g_off;


// License: Unknown, author: Unknown, found: don't remember
float tanh_approx(float x) {
  //  Found this somewhere on the interwebs
  //  return tanh(x);
  float x2 = x*x;
  return clamp(x*(27.0 + x2)/(27.0+9.0*x2), -1.0, 1.0);
}

// License: Unknown, author: nmz (twitter: @stormoid), found: https://www.shadertoy.com/view/NdfyRM
vec3 sRGB(vec3 t) {
  return mix(1.055*pow(t, vec3(1./2.4)) - 0.055, 12.92*t, step(t, vec3(0.0031308)));
}

// License: Unknown, author: Matt Taylor (https://github.com/64), found: https://64.github.io/tonemapping/
vec3 aces_approx(vec3 v) {
  v = max(v, 0.0);
  v *= 0.6f;
  float a = 2.51f;
  float b = 0.03f;
  float c = 2.43f;
  float d = 0.59f;
  float e = 0.14f;
  return clamp((v*(a*v+b))/(v*(c*v+d)+e), 0.0f, 1.0f);
}

mat3 rotX(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(
    1.0 , 0.0 , 0.0
  , 0.0 , +c  , +s
  , 0.0 , -s  , +c
  );
}

mat3 rotY(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(
    +c  , 0.0 , +s
  , 0.0 , 1.0 , 0.0
  , -s  , 0.0 , +c
  );
}

mat3 rotZ(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(
    +c  , +s  , 0.0
  , -s  , +c  , 0.0
  , 0.0 , 0.0 , 1.0
  );
}

float box(vec4 p, vec4 b) {
  vec4 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(max(q.x, q.w),max(q.y,q.z)),0.0);
}

float pmin(float a, float b, float k) {
  float h = clamp(0.5+0.5*(b-a)/k, 0.0, 1.0);
  
  return mix(b, a, h) - k*h*(1.0-h);
}

vec4 pmin(vec4 a, vec4 b, vec4 k) {
  vec4 h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

void sphere_fold(inout vec4 z, inout float dz) {
  float r2 = dot(z, z);
    
  float t1 = (fixed_radius2 / min_radius2);
  float t2 = (fixed_radius2 / r2);

  if (r2 < min_radius2) {
    z  *= t1;
    dz *= t1;
  } else if (r2 < fixed_radius2) {
    z  *= t2;
    dz *= t2;
  }
}

void box_fold(float k, inout vec4 z, inout float dz) {
  // Soft clamp after suggestion from ollij
  vec4 zz = sign(z)*pmin(abs(z), folding_limit, vec4(k));
  z = zz * 2.0 - z;
}

float mb(vec4 z, out float ss) {
  float k = 0.1;
  vec4 offset = z;
  float dr = 1.0;
  for(int n = 0; n < 5; ++n) {
    box_fold(k/dr, z, dr);
    sphere_fold(z, dr);
    z = scale * z + offset;
    dr = dr * abs(scale) + 1.0;
  }

  float d0 = (box(z, vec4(3.5, 3.5, 3.5, 3.5))-0.2) / abs(dr);
  ss = dr;
  return d0;
}

float df(vec3 p, out float ss) {
  const float z = 0.1;
  p /= z;
  vec4 p4 = vec4(p, g_off);
  p4.yzw *= g_rot;
    
  float d0 = mb(p4, ss);
  float d = d0;
  return d*z;
} 

vec3 glow(vec3 ro, vec3 rd, out float tt) {
  float res;
  float t = 0.+0.2;
  int iter = max_iter;

  vec3 col = vec3(0.0);    
  for(int i = 0; i < max_iter; ++i) {
    vec3 p = ro + rd * t;
    float ss;
    res = df(p, ss);
    float lss = log(ss);
    float lum = 0.4*exp(-0.5*t-5.0*res*float(i*i));
    vec3 gcol = ((0.5+0.5*cos(2.4-vec3(0.0, 1.0, 2.0)+1.2*(lss))))*lum;
    col += gcol;
    if(res < 0.0003 * t || res > 20.) {
      iter = i;
      break;
    }
    t += res;
  }
  
  tt = t;
    
  return col;
}

vec3 normal(vec3 pos) {
  vec2  eps = vec2(NORM_OFF,0.0);
  vec3 nor;
  float ss;
  nor.x = df(pos+eps.xyy, ss) - df(pos-eps.xyy, ss);
  nor.y = df(pos+eps.yxy, ss) - df(pos-eps.yxy, ss);
  nor.z = df(pos+eps.yyx, ss) - df(pos-eps.yyx, ss);
  return normalize(nor);
}

vec3 render(vec2 p) {
  float tm = TIME*0.5;
  g_off = sin(tm*0.53);
  g_rot = rotX(0.1*tm)*rotY(0.23*tm)*rotZ(0.31*tm);
  vec3 lightDir = normalize(vec3(-1.0, 1.0, 1.0));
  mat2 rot= ROT(TIME/10.0); 
  vec3 ro = 0.5*vec3(-1.0, 0.5, -0.0);
  lightDir.xz *= rot;
  ro.xz  *= rot;
  vec3 la = vec3(0.0, 0.0, 0.0); 
  vec3 ww = normalize(la-ro);
  vec3 uu = normalize(cross(vec3(0.0,1.0,0.0), ww ));
  vec3 vv = normalize(cross(ww,uu));
  const float fov = 3.0;
  vec3 rd = normalize(-p.x*uu + p.y*vv + fov*ww );

  float tt = 0.0;
  vec3 col = vec3(0.0);
  vec3 gcol = glow(ro, rd, tt);
  vec3 pos = ro+rd*tt;
  vec3 nor = normal(pos);
  vec3 ref = reflect(rd, nor);
 
  float ttt = tanh_approx(0.3*tt);
  float diff  = max(dot(lightDir, nor), 0.0);
  float spe   = pow(max(dot(lightDir, ref), 0.0), 40.0);
  float fre   = dot(rd, nor) + 1.0;
  fre *= fre;
 
  float fog = exp(-0.75*tt);
  float sfog = exp(-2.0*0.5*tt);
  const vec3 scol = 4.0*vec3(1.0, 0.5, 0.5).zyx;
  col += gcol;
  col += spe*sfog*scol;
  return col;
}

void main() {
  vec2 q  = fragCoord/RESOLUTION.xy;
  vec2 p = -1.0 + 2.0*q;
  p.x*=RESOLUTION.x/RESOLUTION.y;

 
  vec3 col = render(p);
  col -= 0.05*vec3(1.0, 2.0, 1.0);
  col = aces_approx(col);
  col = sRGB(col);

  fragColor=vec4(col.x,col.y,col.z,1.0); 
}
