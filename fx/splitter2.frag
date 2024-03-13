#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D input1;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input1

// stolen from https://www.shadertoy.com/view/lXXSz7
float rnd(vec2 p){
    vec2 seed = vec2(13.234, 72.1849);
    return fract(sin(dot(p,seed)) * 43251.1234 * randomrun);
}

void main() 
{
    int iFrame = int(frame);
    vec2 uv = fragCoord/iResolution.xy;

    float it = float(iFrame / 30);
    float ft = float(iFrame % 30) / 30.0;

    float dp = rnd(vec2(it, 0)) * 3.14159 * 2.0;
    vec2 dir = vec2(sin(dp), cos(dp));
    vec2 dir2 = vec2(dir.y, -dir.x);    

    float ruvx = rnd(vec2(it, it)) * 0.4 + 0.3;
    float ruvy = rnd(vec2(0, it)) * 0.4 + 0.3;

    vec2 rc = fragCoord - vec2(ruvx, ruvy) * iResolution.xy;
    float lon = dot(rc, dir);
    float lat = dot(rc, dir2);
    lat += sin(lon * 0.05) * sin(lon * 0.015) * sin(lon * 0.02) * 5.0;// + (sin(lon * .7) + sin(lon * .73) + sin(lon * .76)) * .2;
    
    // mcguirev10 - original thickness multiplier was 8.0
    float thickness = (28.0 + randomrun * 30.0) * ft;

    if (abs(lat) > thickness)
        fragColor = texture(iChannel0, uv + (sign(lat) * dir2 * -thickness) / iResolution.xy);
    else if (abs(lat) > thickness - 2.0)
        fragColor = vec4(1,1,1,0);
    else
        fragColor = texture(input0, uv);
}
