#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 eyecandyShadertoy
#define iTime time

#define N  120
#define PI 3.141593

float circle(vec2 p, float r) {
    return smoothstep(.1, .0, abs(length(p) - r));
}

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    vec2 p = uv * 2. - 1.;
    p.x *= iResolution.x / iResolution.y;
    p *= 2.;
    
    float a = atan(p.y, p.x);    

    vec3 col;

    for (int i = 0; i < N; i++) {
        float fi = float(i);
        float t = fi / float(N);
        float aa = (t + iTime / 12.) * 2. * PI;
        
        float beat = texture(iChannel0, vec2(0.05, 0.5)).g * 0.25;

        float size = .3 + sin(t * 6.* PI) * .1 + beat;
    
        float a1 = -iTime * PI / 3. + aa;
        a1 += sin(iTime + beat);
        a1 += sin(length(p) * 3. + iTime * PI / 2.) * 0.3;
        vec2 c1 = vec2(cos(a1), sin(a1));
        
        float a2 = aa * (4.0 + beat * 0.2);            
        vec2 c2 = vec2(cos(a2), sin(a2)) * 0.3 + c1;
        col.r += .001 / abs(length(p - c2) - size);
        col.g += .0013 / abs(length(p - c2) - size * 1.05);        
        col.b += .0015 / abs(length(p - c2) - size * 1.09);                
    }

    fragColor = vec4(col, 1.0);
}
