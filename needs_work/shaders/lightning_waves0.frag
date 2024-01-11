#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 eyecandyShadertoy
#define iTime time

float random (in vec2 st) {
    return fract(randomrun * st.x * st.y);
//    return fract(sin(dot(st.xy,
//        vec2(12.9898,78.233)))*
//        43758.5453123);
}

float lerp(float a, float b, float f) {
    return (1.0-f)*a + f*b;
}

const float ROTATION_SPEED = 2.7;
vec2 getGradient(vec2 p) {

    float beat = texture(iChannel0, vec2(0.1, 0.5)).g * 1.0;
    float t = iTime;// + sin(beat) * beat;

    float deg = random(p)*8. + t * ROTATION_SPEED*(random(p)*.5+.5);
    vec2 grd = vec2(cos(deg), sin(deg));
    return grd;
}

float gradientNoise(vec2 ps) {
    vec2 pi = floor(ps);
    vec2 pf = fract(ps);
    
    vec2 u = pf * pf * (3.0 - 2.0 * pf);
    //vec2 u = pf;
    
    vec2 llp = pi;
    vec2 llv = getGradient(llp);
    vec2 hlp = pi + vec2(0.0, 1.0);
    vec2 hlv = getGradient(hlp);
    vec2 lrp = pi + vec2(1.0, 0.0);
    vec2 lrv = getGradient(lrp);
    vec2 hrp = pi + vec2(1.0, 1.0);
    vec2 hrv = getGradient(hrp);
    
    float ll = dot(llv, (ps-llp));
    float lr = dot(lrv, (ps-lrp));
    float hl = dot(hlv, (ps-hlp));
    float hr = dot(hrv, (ps-hrp));
    
    float l = lerp(ll, lr, u.x);
    float h = lerp(hl, hr, u.x);
    
    float v = lerp(l, h, u.y);
    
    v = v*0.5+0.5;
    return v;
}

float fbm(vec2 ps) {
    vec2 p = ps;
    float v = 0.0;
    float s = .7;
    for (int i = 0; i < 17; i++) {
        v += gradientNoise(p) * s;
        s *= 0.33;
        p *= 2.0;
    }
    return v;
}

vec2 v2fbm(vec2 ps) {
    float x = fbm(ps);
    float y = fbm(ps+vec2(5.0, 4.0));
    return vec2(x, y)*0.4;
}

float warpedFBM(vec2 ps) {
    return fbm(ps+v2fbm(ps+v2fbm(ps)));
}

void main()
{
    vec2 uv = fragCoord/iResolution.y;
    uv *= 1.;
    vec3 col = vec3(warpedFBM(uv));
    fragColor = vec4(col,1.0);
}
