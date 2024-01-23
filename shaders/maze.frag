#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define iResolution vec3(resolution.x, resolution.y, 1.0)

vec3 rgb2hsv(vec3 c);
vec3 hsv2rgb(vec3 c);

#define I (fragCoord * resolution)
#define O fragColor

void main() 
{
    // mcguirev10 - time-twitch based on beat
    float fft = texture(eyecandyShadertoy, vec2(0.07, 0.25)).g;
    float iTime = time + (fft - 0.45);

    //Clear fragcolor
    O *= 0.;
    
    //Raymarch loop:
    //iterator, step-size, raymarch distance, Tau
    //Raymarchs 100 times adding brightness when close to a surface
    for(float i,s,d,z,T=6.283; i++<1e2; O+=1e-5/(.001-s))
    {
        //Rotation matrix
        mat2 R = mat2(8,6,-6,8)*.1;
        //Resolution for scaling
        vec3 r = iResolution,
        //Project sample with roll rotation and distance
        p = vec3((I+I-r.xy)/r.x*d*R, d-9.)*.7;
        //Rotate pitch
        p.yz *= R;
        z = p.z;
        //Step forward (negative for code golfing reasons)
        d -= s = min(z, cos(dot(
            //Compute subcell coordinates
            modf(fract((
            //Using polar-log coordinates
            vec3(atan(p.y,p.x),log(s=length(p.xy)),0)/T-iTime/2e1)*
            //Rotate 45 degrees and scale repetition
            mat3(1,1,0,1,-1,O-O))*15., p),
        //Randomly flip cells and correct for scaling
        sign(cos(p+p.y)))*T)*s/4e1);
    }

    // mcguirev10 - time based color shift (sound makes it too spazzy)
    vec3 hsv = rgb2hsv(O.rgb);
    float hue = hsv.x + abs(sin(time * 0.1));
    vec3 rgb = hsv2rgb(vec3(hue, 1.0, hsv.z));
    O = vec4(rgb.rgb, 1.0);
}