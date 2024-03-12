#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputA;
out vec4 fragColor;

// mcguirev10 - on Shadertoy this is 3.0, but for whatever reason
// that is very very dark in monkey-hi-hat... 16.0 looks good to me
uniform float gammaFactor = 16.0;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 inputA

#define PHI 1.61803
#define PI  3.14159

float smoothNoise(vec2 p) {
	vec2 i = floor(p); p-=i; p *= p*(3.-p-p); 
    return dot(mat2(fract(sin(vec4(0, 1, 27, 28) + i.x+i.y*27.) * 1e5))*vec2(1.-p.y,p.y), vec2(1.-p.x, p.x));
}

float fractalNoise(vec2 p) {
    return smoothNoise(p)*.5333 + smoothNoise(p*2.)*.2667 + smoothNoise(p*4.)*.1333 + smoothNoise(p*8.)*.0667;
}

float warpedNoise(vec2 p) {
    vec2 m = vec2(iTime, -iTime)*.15;//vec2(sin(iTime*0.5), cos(iTime*0.5));
    
    float x = fractalNoise(p + m);
    float y = fractalNoise(p + m.yx + x);
    float z = fractalNoise(p - m - x + y);
    return fractalNoise(p + vec2(x, y) + vec2(y, z) + vec2(z, x) + length(vec3(x, y, z))*0.25);
}

vec3 bump3y (vec3 x, vec3 yoffset) {
    vec3 y = 1. - x * x;
    y = clamp((y-yoffset), vec3(0), vec3(1));
    return y;
}

vec3 spectral_zucconi6(float x) {
    x = fract(x);
    const vec3 c1 = vec3(3.54585104, 2.93225262, 2.41593945);
    const vec3 x1 = vec3(0.69549072, 0.49228336, 0.27699880);
    const vec3 y1 = vec3(0.02312639, 0.15225084, 0.52607955);
    const vec3 c2 = vec3(3.90307140, 3.21182957, 3.96587128);
    const vec3 x2 = vec3(0.11748627, 0.86755042, 0.66077860);
    const vec3 y2 = vec3(0.84897130, 0.88445281, 0.73949448);
    return bump3y(c1 * (x - x1), y1) + bump3y(c2 * (x - x2), y2) ;
}

vec3 colNoise(vec2 uv, float colShift) {
    float nl = warpedNoise(uv*2.);
    // Take two noise function samples near one another.
    float n = warpedNoise(uv * 6.);
    float n2 = warpedNoise(uv * 6. + .03*sin(nl));
    
    // Highlighting - Effective, but not a substitute for bump mapping.
    //
    // Use a sample distance variation to produce some cheap and nasty highlighting. The process 
    // is vaguely related to directional derivative lighting, which in turn is mildly connected to 
    // Calculus from First Principles.
    float bump = max(n2 - n, 0.)/.02*.7071;
    float bump2 = max(n - n2, 0.)/.02*.7071;
    
    // Ramping the bump values up.
    bump = bump*bump*.5 + pow(bump, 4.)*.5;
    bump2 = bump2*bump2*.5 + pow(bump2, 4.)*.5;
    
    vec3 col = spectral_zucconi6(nl+n*1.5+colShift)*(vec3(1.000,0.800,0.973)*vec3(1.2*bump, (bump + bump2)*.4, bump2)*.3);

    return col;
}

mat2 rot(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a));}

float n21(vec2 p) {
    p = fract(p*vec2(234.42,725.46));
    p += dot(p, p+54.98);
    return fract(p.x*p.y);
}

vec2 n22(vec2 p) {
    float n = n21(p);
    return vec2(n, n21(p+n));
}

void main() 
{
    // Screen coordinates. Using division by a scalar, namely "iResolution.y," for aspect correctness.
    vec2 uv = (fragCoord.xy - .5*iResolution.xy)/iResolution.y;
    
    uv.x = abs(uv.x);
   
    vec3 col = vec3(0);
    // vec3 col = colNoise(uv*2.) + colNoise(uv)*1.2 + .25*colNoise(uv*.4)+.1*colNoise(uv*.1);
    
    for(float i=.0; i<=.8; i+=.2) {   
        float z = fract(i-.1*iTime);
        float fade = smoothstep(.8, .1, z); // 
        //uv += 0.2*n22(vec2(i*412., 52423.*i));
        uv *= rot(2.*PI/PHI+ PI/12.*sin(.1*iTime));       // Rotate layer
        vec2 UV = uv*1.5*z+ + n22(vec2(i*51., 4213.*i));  // Scale and offset layer by random value
      
        col += colNoise(UV, iTime*.11+z)*fade;
    }
    
    // Exact gamma correction.
	//col = vec3(pow(max(col, 0.0), vec3(1./2.2)))*3.;
    col = vec3(pow(max(col, 0.0), vec3(1./2.2))) * gammaFactor;
    
    vec4 tex = texture(iChannel0, fragCoord/iResolution.xy);
    if (tex.a != iResolution.x) tex = vec4(0); // detect resolution change
    
    col = mix(col, tex.rgb, 0.95); // Feedback
    fragColor = vec4(col, iResolution.x);
}