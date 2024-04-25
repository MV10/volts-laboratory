#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iChannel0 eyecandyShadertoy

#define PI              3.141592654
#define TAU             (2.0*PI)
#define TIME            time
#define RESOLUTION      resolution
#define ROT(a)          mat2(cos(a), sin(a), -sin(a), cos(a))

const vec4 hsv2rgb_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www);
  return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0, 1.0), c.y);
}

#define HSV2RGB(c)  (c.z * mix(hsv2rgb_K.xxx, clamp(abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www) - hsv2rgb_K.xxx, 0.0, 1.0), c.y))

float hash(float co) {
  return fract(sin(co*12.9898) * 13758.5453);
}

float mod1(inout float p, float size) {
  float halfsize = size*0.5;
  float c = floor((p + halfsize)/size);
  p = mod(p + halfsize, size) - halfsize;
  return c;
}

vec2 rayCylinder(vec3 ro, vec3 rd, vec3 cb, vec3 ca, float cr) {
  vec3  oc = ro - cb;
  float card = dot(ca,rd);
  float caoc = dot(ca,oc);
  float a = 1.0 - card*card;
  float b = dot( oc, rd) - caoc*card;
  float c = dot( oc, oc) - caoc*caoc - cr*cr;
  float h = b*b - a*c;
  if( h<0.0 ) return vec2(-1.0); //no intersection
  h = sqrt(h);
  return vec2(-b-h,-b+h)/a;
}

float dfcos(float x) {
  return sqrt(x*x+1.0)*0.8-1.8;
}

float dfcos(vec2 p, float freq) {
  float x = p.x;
  float y = p.y;
  x *= freq;
    
  float x1 = abs(mod(x+PI,TAU)-PI);
  float x2 = abs(mod(x   ,TAU)-PI);
    
  float a = 0.18*freq;
    
  x1 /= max( y*a+1.0-a,1.0);
  x2 /= max(-y*a+1.0-a,1.0);
  return (mix(-dfcos(x2)-1.0,dfcos(x1)+1.0,clamp(y*0.5+0.5,0.0,1.0)))/max(freq*0.8,1.0)+max(abs(y)-1.0,0.0)*sign(y);
}

vec3 skyColor(vec3 ro, vec3 rd) {
  const vec3 l = normalize(vec3(0.0, 0., -1.0));

// vec3 baseCol = HSV2RGB(vec3(0.96, 0.95, .0025));

    float vu = texture( iChannel0, vec2(.0, 0.01)).g;
    vec3 baseCol = HSV2RGB(vec3(vu*1.83, 0.95, .0025));   // cycle hue
    baseCol *= vu;                                        // adapt size
      
  return baseCol/(1.00001+dot(rd, l));
}

vec3 color(vec3 ww, vec3 uu, vec3 vv, vec3 ro, vec2 p) {
  const float rdd = 2.0;
  const float mm = 4.0;
  const float rep = 27.0;

  vec3 rd = normalize(-p.x*uu + p.y*vv + rdd*ww);
  
  // "sky" also creates the sun in the center
  vec3 skyCol = skyColor(ro, rd);

// rotation speed
  rd.yx *= ROT(.1*TIME);
    

  vec3 col = skyCol;

  // I read somewhere that if you call atan in a shader you got no business writing shader code.
  //  I even call it in a loop :)
  float a = atan(rd.y, rd.x);
  
  for(float i = 0.0; i < mm; ++i) {
  
    float ma = a;
    float sz = rep+i*6.0;
    float slices = TAU/sz; 
    float na = mod1(ma, slices);

    float h1 = hash(na+13.0*i+123.4);   // number of "eels" (lower is more)
    float h2 = fract(h1*3677.0);        // color sequence/freq on eel
    float h3 = fract(h1*8677.0);

    float tr = mix(0.5, 3.0, h1);       // parallax effect ("layer" distance)
    

    // cylinder: base point ro, a normalized axis ca and a radius tr
    vec2 tc = rayCylinder(ro, rd, ro, vec3(0.0, 0.0, 1.0), tr);
    
    vec3 tcp = ro + tc.y*rd;// wave freq

    if (i == 2.) tcp *= 2.;// added: smaller blocks

    vec2 tcp2 = vec2(tcp.z, atan(tcp.y, tcp.x));
  
    float zz = mix(0.025, 0.05, sqrt(h1))*rep/sz;
    float tnpy = mod1(tcp2.y, slices);
    float fo = smoothstep(0.5*slices, 0.25*slices, abs(tcp2.y));
    
    // wiggle speed
//    tcp2.x += -h2*TIME;
    tcp2.x += -h2*TIME * 3.;


    tcp2.y *= tr*PI/4.0;// width of the eels
    
     float vu2 = (i == 3.0) ? 0.8 - ((texture( iChannel0, vec2(.0, 0.8)).g ))*0.7 : 1.;
     tcp2.y*= vu2;

    
    tcp2/=zz;
    float d = dfcos(tcp2, 2.0*zz);   // wiggle freq
//    float d = tcp2.y;              // straight rays instead of wiggles
    d = abs(d);
    
    
    float vu3 = (i == 2.0) ? 0.3 - ((texture( iChannel0, vec2(.0, 0.3)).g ))*.5 : 1.;
    d *= zz*vu3;// "smaller" -> blur more

    vec3 bcol = (1.0+cos(vec3(0.0, 1.0, 2.0)+TAU*h3+0.5*h2*h2*tcp.z))*0.00005;
    bcol /= max(d*d, 0.000+5E-7*tc.y*tc.y);
    
    
    bcol *= exp(-0.04*tc.y*tc.y);    
//    bcol *= smoothstep(-0.5, 1.0, sin(mix(0.125, 1.0, h2)*tcp.z) );
    bcol *= smoothstep(-1.0, 2.0, sin(mix(0.125, 1.0, h2)*tcp.z) );
 
    float dz = (i == 1.0) ? texture( iChannel0, vec2(.0, 0.1)).g * 5.0 : 0.0; // displace "eel"
    bcol *= smoothstep(-0.5, 1.0, sin(mix(0.125, 1.0, h2*6.)*(tcp.z + dz)));

    bcol *= fo;// not much difference

    col += bcol;
  }

  return col;
}

vec3 sRGB(vec3 t) {
  return mix(1.055*pow(t, vec3(1./2.4)) - 0.055, 12.92*t, step(t, vec3(0.0031308)));
}

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

vec3 effect(vec2 p, vec2 pp) {
  float tm = 1.5*TIME+12.3;
  
  vec3 ro   = vec3(0.0, 0.0, tm);// zoom speed
  vec3 dro  = normalize(vec3(0., 0.0, 3.0));
  
  tm*=5.; // added: move "sun" faster
  
  dro.xz *= ROT(0.2*sin(0.05*tm));
  dro.yz *= ROT(0.2*sin(0.05*tm*sqrt(0.5)));
  
  const vec3 up = vec3(0.0,1.0,0.0);
  vec3 ww = normalize(dro);
  vec3 uu = normalize(cross(up, ww));
  vec3 vv = (cross(ww, uu));
  vec3 col = color(ww, uu, vv, ro, p);
  
  col -= 0.125*vec3(0.0, 1.0, 2.0).yzx*length(pp);
  
  col = aces_approx(col);
  col = sRGB(col);
  return col;
}

void main() 
{
  vec2 q = fragCoord/RESOLUTION.xy;
  vec2 p = -1. + 2. * q;
  vec2 pp = p;
  p.x *= RESOLUTION.x/RESOLUTION.y;

  vec3 col = effect(p, pp);
  fragColor = vec4(col, 1.0);
}