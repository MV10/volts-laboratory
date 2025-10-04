#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

const float path_radius = 50.;
const float tunnel_radius = 10.;
const float deformation = 2.;
const float reflection = 1.9;
const int reflections = 4;
const float ambient = 0.01;
const float light_chance = 0.003;
const float speed = 20.;

const float tau = 2.*acos(-1.); // dont change

mat2 rotate(float a)
{
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

// from https://www.shadertoy.com/view/4djSRW by David Hoskins (MIT License)
float hash(vec3 p)
{
	p  = fract(p * .1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
}

vec2 hash(float x)
{
	vec3 p = fract(vec3(x) * vec3(.1031, .1030, .0973));
	p += dot(p, p.yzx + 33.33);
    return fract((p.xx+p.yz)*p.zy);
}

vec2 smoothstepd(float x)
{
    return vec2(
        smoothstep(0., 1., x), // cubic smoothstep (3x^2-2x^3)
        6.0*x*(1.0-x) // derivative
    );
}

// value noise that returns a vec2, no clue what to call it
vec4 valued(float x)
{
    float id = floor(x);
    float t = fract(x);
    
    vec2 tdt = smoothstepd(t);
    
    vec2 a = hash(id),
    b = hash(id+1.);
    
    vec2 d = b - a;
    
    return vec4(
        b-d*(1.-tdt.x), // same as mix(a,b,tdt.x),
        d*tdt.y
    );
}

vec4 pathd(float x)
{
    x /= path_radius;
    vec4 n = valued(x);
    
    return vec4(
        n.xy * path_radius,
        n.zw
    );
}

bool get(vec3 p)
{
    return length(p.xy-pathd(p.z).xy) > tunnel_radius + mix(-deformation, deformation, hash(p+42.));
}

float dda(vec3 ro, vec3 rd, out vec3 map) // dda without conditionals
{
    vec2 uv = (gl_FragCoord.xy*2. - iResolution.xy ) / iResolution.x;

    float rep =1.5;

    float r3 = normalize(vec3(length(uv),0.1,0.51)).x;
    float a3 = log2(r3) - iTime * 0.000522;
    a3 *= rep /3.14;
    float theta = atan(uv.y, uv.x);
    theta *= rep /3.14;
    vec2 polarUV = vec2(theta, a3);

    vec3 mapstep = sign(rd);
    
    map = floor(ro);
    
    vec3 axisstep = 1. / abs(rd),
    axis = (sign(rd) * ((map  - ro) + .5) + .5) * axisstep;
    
    for(int i=0; i++<512;)
    {
        // 1 where smallest element of axis, else 0
        vec3 stepdir; //= step(axis, min(axis.yzx, axis.zxy));
           
        // move
        axis += axisstep * (stepdir = step(axis, min(axis.yzx, axis.zxy)));
        
        map += mapstep * stepdir;
    
        // calculate depth if hit
        if(get(map)) return dot(stepdir, axis - axisstep);
           
    }
    return -1.;
}

vec3 color(vec3 p)
{
    return 0.5+0.5*cos(tau*hash(p)+vec3(0,2,4));
}

float light(vec3 p)
{
    return hash(p.yzx) < light_chance ? 1. : 0.;
}

void main()
{
    vec2 uv = (fragCoord*2. - iResolution.xy ) / iResolution.x;

    float rep =1.5;

    float r3 = normalize(vec3(length(uv),0.1,0.51)).x;
    float a3 = log2(r3) - iTime * 0.100522;
    a3 *= rep /3.14;
    float theta = atan(uv.y, uv.x);
    theta *= rep /3.14;
    vec2 polarUV = vec2(theta, a3);

    float k = iTime*speed;
    vec4 path = (
        pathd(k) +
        pathd(k+0.50) +
        pathd(k+0.25)
        ) / 3.;
    
    vec3 r2 = normalize(vec3(uv.xy, 1.0 - dot(uv.xy, uv.xy) *3.5));
    r2*=100.;  

    vec3 ro = vec3(path.xy, k);
    vec3 rd = normalize(vec3(uv, 0.111))+r2;
    
    mat2 R = rotate(iTime/4.);
    rd.xy *= R;
   
    vec2 v = 0.50*path.zw;
    R = rotate(-v.x);
    rd.yz *= R;
    R = rotate(-v.x);
    rd.xz *= R;
    
    vec3 map;
    float d;

    vec3[reflections] colors;
    float[reflections] lights;
      
    // bounce light ray
    for(int i=0; i<reflections; i++)
    {
        float t = dda(ro, rd, map);
        if(i==0) d = t;
        if(t<0.) break;
        ro += rd * t;
      
        vec3 sn = abs(fract(ro)-0.5); // surface normal
        sn = step(max(sn.yzx, sn.zxy), sn) * sign(rd);
        
        colors[i] = color(map);
        lights[i] = light(map);
        
        rd = reflect(rd, sn);
    }
    
    vec3 col = vec3(0);
    float brightness = 0.;
    
    // loop in reverse for lighting, probably possible otherwise
    for(int i=reflections-1; i>=0; i--)
    {
        col = colors[i] * (col * reflection + lights[i] + ambient);
        brightness = brightness * reflection * 0.5 + lights[i];
    }
    
    brightness = clamp(brightness, 0., 1.);
    
    fragColor = vec4(sqrt(col*10.), brightness);

    fragColor.a = 1.0;
}
