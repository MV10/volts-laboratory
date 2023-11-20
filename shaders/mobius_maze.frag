#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
uniform sampler2D iChannel0;
out vec4 fragColor;

#define iResolution vec3(resolution.x, resolution.y, 1.0)

vec3 rgb2hsv(vec3 c);
vec3 hsv2rgb(vec3 c);

#define I (fragCoord * resolution)
#define O fragColor

void main() 
{
    // mcguirev10 - make it more interesting
    float fft = texture(eyecandyShadertoy, vec2(0.07, 0.5)).g;
    float iTime = time + (fft - 0.45);

    //Clear fragcolor
    O -= O;
    //Loop through layers and initialize vecs
    for(vec2 r = iResolution.xy, z, p=r-r, i=p;
        //Loop 100 times
        i.y++<1e2;
        //Sink holes
        i.y < 1e2 - length(dFdy(p))*r.y*.2 
        //Maze walls
        && abs( fract( p.x+p.y*sign(texture(iChannel0,ceil(p)/2e1 ).r - .5) )
                 -.5 )  >.3
        //Color from layer height
        ? O = i.y*i.yyyy/1e4 : O   
    )
        //Get centered coordinates (scaled for perspective)
        z = p = ( I+I-i - r ) / r.y / vec2(2,1),
        //Offset holes
        z.x++, p.x-=.5,
        //Mobius transform from FabriceNeyret2
        p =   log(length(p = p*mat2(z,-z.y,z)/dot(p,p) +.5 )) *vec2(5,-5)
            + atan(p.y,p.x) / .314  +  iTime;

    // mcguirev10 - color shifts to make it more interesting
    vec3 hsv = rgb2hsv(O.rgb);
    float hue = fft;
    vec3 rgb = hsv2rgb(vec3(hue, 1.0, hsv.z));
    O = vec4(rgb.rgb, 1.0);
}