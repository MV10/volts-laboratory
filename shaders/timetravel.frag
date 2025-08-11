#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

#define FAR 1e3
#define INFINITY 1e32
#define T time
#define FOV 70.0
#define PI 3.14159265

float hash12(vec2 p) {
    float h = dot(p,vec2(127.1,311.7));    
    return fract(sin(h)*43758.5453123);
}

float hash33(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// 3d noise
float noise_3(in vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);    
    vec3 u = 1.-(--f)*f*1.1*f*f*-f;
    
    vec2 ii = i.xy + i.z * vec2(5.0);
    float a = hash12(ii + vec2(0.0,0.0));
    float b = hash12(ii + vec2(1.0,0.0));    
    float c = hash12(ii + vec2(0.0,1.0));
    float d = hash12(ii + vec2(1.0,1.0));
    float v1 = mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    
    ii += vec2(5.0);
    a = hash12(ii + vec2(0.0,0.0));
    b = hash12(ii + vec2(1.0,0.0));    
    c = hash12(ii + vec2(0.0,1.0));
    d = hash12(ii + vec2(1.0,1.0));
    float v2 = mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        
    return max(mix(v1, v2, u.z), 0.);
}

float noise_3_new(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);    
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(mix(hash33(i + vec3(0, 0, 0)), hash33(i + vec3(1, 0, 0)), u.x),
                   mix(hash33(i + vec3(0, 1, 0)), hash33(i + vec3(1, 1, 0)), u.x), u.y),
               mix(mix(hash33(i + vec3(0, 0, 1)), hash33(i + vec3(1, 0, 1)), u.x),
                   mix(hash33(i + vec3(0, 1, 1)), hash33(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}

float fbm(vec3 x) {
    float r = 0.0;
    float w = 1.0, s = 1.0;
    for (int i = 0; i < 6; i++) {
        w *= 0.26;
        s *= 3.0;
        vec3 p = x * s;
        mat3 rotMat = mat3(
            cos(PI/4.0), -sin(PI/4.0), 0.0,
            sin(PI/4.0), cos(PI/4.0), 0.0,
            0.0, 0.0, 1.0
        );
        p *= rotMat;
        r += w * noise_3(p);
    }
    return r*1.2;
}

float fbm_new(vec3 x) {
    float r = 0.0;
    float w = 1.05, s = 1.;
    for (int i = 0; i < 5; i++) {
        w *= 0.26;
        s *= 3.;
        r += w * noise_3_new(s * x);
    }
    return r;
}

float yC(float x) {
    return cos(x * -.134) * 1. * cos(x * .13) * 15. + fbm(vec3(x * .1, 0., 0.) * 55.4);
}

void pR(inout vec2 p, float a) {
    p = cos(a) * p + sin(a) * vec2(p.y, -p.x);
}

struct geometry {
    float dist;
    vec3 hit;
    int iterations;
};

float fCylinderInf(vec3 p, float r) {
    return length(p.xz) - r + 1.0;
}

geometry map(vec3 p) {
    p.x -= yC(p.y * .1) * 3.;
    p.z += yC(p.y * .01) * 4.;
    
    float n = pow(abs(fbm(p * .07)) * 12., 1.3);
    float s = fbm(p * 0.01 + vec3(0., T * 0.14, 0.)) * 128.;
    
    geometry obj;
    obj.dist = max(0., -fCylinderInf(p, s + 18. - n));
    
    p.x -= sin(p.y * .02) * 34. + sin(p.z * 0.01) * 62.;
    obj.dist = max(obj.dist, -fCylinderInf(p, s + 28. + n * 2.));
    
    return obj;
}

float t_min = 10.0;
float t_max = FAR;
const int MAX_ITERATIONS = 100;

geometry trace(vec3 o, vec3 d) {
    float omega = 1.3;
    float t = t_min;
    float candidate_error = INFINITY;
    float candidate_t = t_min;
    float previousRadius = 0.;
    float stepLength = 0.;
    float pixelRadius = 1. / 1000.;
    
    geometry mp = map(o);
    float functionSign = mp.dist < 0. ? -1. : +1.;
    float minDist = FAR;
    
    for (int i = 0; i < MAX_ITERATIONS; ++i) {
        mp = map(d * t + o);
        mp.iterations = i;
    
        float signedRadius = functionSign * mp.dist;
        float radius = abs(signedRadius);
        bool sorFail = omega > 1. && (radius + previousRadius) < stepLength;
        
        if (sorFail) {
            stepLength -= omega * stepLength;
            omega = 1.;
        } else {
            stepLength = signedRadius * omega;
        }
        previousRadius = radius;
        float error = radius / t;
        
        if (!sorFail && error < candidate_error) {
            candidate_t = t;
            candidate_error = error;
        }
        
        if (!sorFail && error < pixelRadius || t > t_max) break;
        
        t += stepLength * .5;
    }
    
    mp.dist = candidate_t;
    if ((t > t_max || candidate_error > pixelRadius)) mp.dist = INFINITY;
    
    return mp;
}

float rotatingSmoke(vec3 p, float time) {
    float theta = time * 0.2;
    mat2 rotMat = mat2(cos(theta), -sin(theta), sin(theta), cos(theta));
    p.xy *= rotMat;
    return fbm(p * 0.5);
}

void main()
{
    vec2 ouv = fragCoord.xy / iResolution.xy;
    vec2 uv = ouv - .5;
    uv *= tan(radians(FOV) / 2.0) * 4.;
    
    vec3 vuv = normalize(vec3(cos(T), sin(T * .11), sin(T * .41)));
    vec3 ro = vec3(0., 30. + iTime * 100., -.1);
    ro.x += yC(ro.y * .1) * 3.;
    ro.z -= yC(ro.y * .01) * 4.;
    
    vec3 vrp = vec3(0., 50. + iTime * 102., 2.);
    vrp.x += yC(vrp.y * .1) * 3.;
    vrp.z -= yC(vrp.y * .01) * 4.;
    
    vec3 vpn = normalize(vrp - ro);
    vec3 u = normalize(cross(vuv, vpn));
    vec3 v = cross(vpn, u);
    vec3 vcv = ro + vpn;
    vec3 scrCoord = vcv + uv.x * u * iResolution.x / iResolution.y + uv.y * v;
    vec3 rd = normalize(scrCoord - ro);
    vec3 oro = ro;
    
    vec3 sceneColor = vec3(0.);
    geometry tr = trace(ro, rd);
    tr.hit = ro + rd * tr.dist;
    
    vec3 col = vec3(1., 0.5, .4) * fbm(tr.hit.xzy * .01) * 20.;
    col.b *= fbm(tr.hit * .01) * 10.;  
    
    sceneColor += min(.8, float(tr.iterations) / 90.) * col + col * .03;
    sceneColor *= 1. + .9 * (abs(fbm(tr.hit * .002 + 3.) * 10.) * (fbm(vec3(0., 0., iTime * .05) * 2.)) * 1.);
    sceneColor = pow(sceneColor, vec3(1.)) * 0.6;
    
    vec3 steamColor1 = vec3(.0, .4, .5);
    vec3 rro = oro;
    ro = tr.hit;
    float distC = tr.dist, f = 0., st = .9;
    
    for (float i = 0.; i < 24.; i++) {
        rro = ro - rd * distC;
        f += fbm(rro * vec3(.1, .1, .1) * .3) * .1;
        distC -= 3.;
        if (distC < 3.) break;
    }
 
    sceneColor += steamColor1 * pow(abs(f * 1.5), 3.) * 4.;
   
    // smoke
    vec3 smokeP = ro + rd * (tr.dist * 0.5);
    float smoke = rotatingSmoke(smokeP, T);
    vec3 smokeColor = vec3(0.5, 0.5, 0.5) * smoke;
    sceneColor = mix(sceneColor, smokeColor, 0.5);
    
    fragColor = vec4(clamp(sceneColor * (1. - length(uv) / 2.), 0.0, 1.0), 1.0);
    fragColor = pow(abs(fragColor / tr.dist * 130.), vec4(.8));
}
