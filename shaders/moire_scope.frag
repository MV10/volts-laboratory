#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution

vec3 palette( float t ){
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    
    return a + b*cos(6.28318*(c*t+d));
}
void main() 
{
    float iTime = (time + texture(eyecandyShadertoy, vec2(0.07, 0.5)).g * 5.0);

    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    for (float i = 0.0; i < 4.0; i++)
    {
        uv = fract(uv*1.618) - 0.5;

        float d = length(uv) * (-length(uv0));

        vec3 col = palette(length(uv0) * i++*0.4 + iTime*0.4);

        d = tan(d*21. + iTime)/34.;
        d = abs(d);

        d = pow(0.01 / d, 0.8);
        
        finalColor += col * d;
    }
    
    fragColor = vec4(finalColor, 1.0);
}
