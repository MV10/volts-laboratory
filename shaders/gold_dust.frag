#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define iResolution resolution
#define iTime time

// arrrrgh I hate this "golfing" obfuscation nonsense...
#define O fragColor
#define I (fragCoord * resolution)

void main()
{
    //Animation time
    float t = iTime,
    //Raymarch depth
    z,
    //Step distance
    d,
    //Signed distance
    s,
    //Raymarch iterator
    i;
    
    
    //Clear fragColor and raymarch 80 steps
    for(O*=i; i++<8e1;
        //Coloring and brightness
        O+=(cos(s+vec4(0,1,2,0))+1.)/d*z)
    {
        //Sample point (from ray direction)
        vec3 p = z*normalize(vec3(I+I,0)-iResolution.xyy),
        //Rotation axis
        a = normalize(cos(vec3(1,2,0)+t-d*8.));
        //Move camera back 5 units
        p.z+=5.,
        //Rotated coordinates
        a = a*dot(a,p)-cross(a,p);
        
        //Turbulence loop
        for(d=1.;d++<9.;)
            a+=sin(a*d+t).yzx/d;
        
        //Distance to ring
        z+=d=.1*abs(length(p)-3.)+.04*abs(s=a.y);
    }
    //Tanh tonemap
    O = tanh(O/3e4);
}
