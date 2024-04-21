#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

#define FAR 60.
#define PI 3.14159
mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c,-s,s,c);
}

float sdBox( vec3 p, vec3 b ){
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

vec2 boxes(vec3 p) {
    vec2 h,t = vec2(1000,0);
    vec3 q = p;
    q.xy *= rot(iTime);
    h = vec2(sdBox(abs(q)-vec3(4,0,0), vec3(1,4,1))-.1, 1);
    t = h.x<t.x ? h : t;
    
    q = p;
    q.xy *= rot(iTime);
    h = vec2(sdBox(abs(q)-vec3(0,4,2), vec3(4,1,1))-.1, 1);
    t = h.x<t.x ? h : t;
    return t;
}

vec2 map(vec3 p) {
    // kaleidoscope effect adapted from @NuSan
    for (float i=0.; i<4.; i++) {
        p = abs(p);
        p.xy *= rot(sin(iTime*.5 + i*2.));
        p -= i*mix(1.,1.5,sin(iTime)*.5+.5);
    }
    p.xy *= rot(iTime*.5);
    p.yz *= rot(iTime*.5);    
    vec2 t = min(boxes(p), boxes(p*2.)/2.);
    return t;
}

vec3 normal(vec3 p) {
    vec2 e = vec2(.001,0);
    return normalize(map(p).x - vec3(map(p-e.xyy).x, map(p-e.yxy).x, map(p-e.yyx).x));
}

void cam(inout vec3 p) {
    p.xz *= rot(iTime*.2);
}

mat2 rotationMatrix(float angle)
{
	angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, -s, 
                 s,  c );
}

void main() 
{
    vec2 uv = fragCoord/iResolution.xy;
    uv = uv*2.-1.;
    uv.x *= iResolution.x/iResolution.y;

    // mcguirev10 - rotation is fun
    uv *= rotationMatrix(time * 24.0 * (randomrun - 0.5));
    
    vec3 col = vec3(0);
    
    vec3 ro = vec3(0,0,mix(-25.,-35., cos(PI+iTime*.5)*.5+.5));
    vec3 rd = normalize(vec3(uv, 1));
    
    //cam(ro);cam(rd);
    
    float t = 0.;
    for (float i=0.; i<100.; i++) {
        vec3 p = ro + rd*t;
        vec2 h = map(p);
        float d = h.x;
        float m = h.y;
        t += d;
        if (t>FAR) {
            break;
        }
        if (d < .001) {
            vec3 sn = normal(p);
            col = .5+.5*cos((sn*.3+.15)*PI+iTime+vec3(0,4,8).yxz + dot(sn,vec3(1))*PI );
            break;
        }
        float a = atan(uv.y,uv.x);
        col += (1./d *.02)*(.5*.5+cos(iTime+a+vec3(0,2,4)));
    }
    
    fragColor.xyz = pow(col,vec3(.4545));
}