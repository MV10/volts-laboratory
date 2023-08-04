#version 320 es
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D sound;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 sound
#define iChannel1 sound
#define iTime time

vec2 rotateAndScale(vec2 point, float wave, float i)
{
    // scale over time
    float scale = 0.4 + (sin(iTime * 0.1) * 0.65) + (i * 0.45) ;
    point *= scale;

    // rotate over time
    float degree = iTime * pow(1.7,i+1.0); 
    
    vec2 pivot = vec2(0.0);
    float radAngle = -radians(degree);// "-" - clockwise
    float x = point.x;
    float y = point.y;

    float rX = pivot.x + (x - pivot.x) * cos(radAngle) - (y - pivot.y) * sin(radAngle);
    float rY = pivot.y + (x - pivot.x) * sin(radAngle) + (y - pivot.y) * cos(radAngle);

    point = vec2(rX, rY);

    // move over time
    point.x += iTime * pow(0.31, i + 1.0) ;
    point.y += iTime * -pow(0.27, i + 1.0);
    
    return point;
}


// cosine based palette, 4 vec3 params
vec3 palette( in float t)
{
    vec3 a = vec3(0.648, 0.828, 0.738);
    vec3 b = vec3(0.448, 0.228, 0.268);
    vec3 c = vec3(3.138, 2.488, 1.858);
    vec3 d = vec3(1.078, -0.132, 0.358);
    
    return a + b*cos( 6.28318*(c*t+d) );
}

void main()
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    
    vec2 uv0 = uv;
    float j = length(uv);

    float wave = texture(iChannel0, vec2(j, j)).g;

    vec3 finalColor = vec3(0.0);
    
    for (float i = 0.0; i < 4.0; i++) {
        float magi = 1.0 + (wave * 2.0 - 1.0) * (0.15 * i);
        
        uv = rotateAndScale(uv, magi, i);
        uv = fract(uv * 1.5) - 0.5;
        
        float d = (length(uv) * magi) * exp(-length(uv0));
    
        vec3 col = palette((length(uv0) + magi) + i*.4 + iTime / 8.0);
    
        d = sin(d * 8.0 + iTime) / 8.0;
        d = abs(d);
    
        d = pow(0.01 / d, 2.0);
    
        finalColor += col * d ;
    }
    
 
    uv0 = rotateAndScale(uv0, wave, 1.0) * 0.7;
    float tex = texture(iChannel1, uv0).g;
    
    float timeScaleClouds = 0.1 + (sin(iTime * 0.7) + 1.0) * 0.75;
    
    tex = 1.0 / pow(0.4/tex, 2.0) * timeScaleClouds; 
    
    vec3 col = vec3(tex);

    fragColor = vec4(finalColor * col, 1.0);

  //fragColor = vec4(rbg); 
    
    
    //fragColor = vec4(waver, waveg, waveb, 1.0);
}