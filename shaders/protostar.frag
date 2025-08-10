#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define iResolution resolution
#define iTime time

// golfing sucks
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
    
    
    //Clear fragColor and raymarch 100 steps
    for(O*=i; i++<2e2;
        //Coloring and brightness
        O+=(cos(s/.6+vec4(0,1,2,0))+1.1)/d)
    {
        //Sample point (from ray direction)
        vec3 p = z*normalize(vec3(I+I,0)-iResolution.xyy),
        //Rotation axis
        a = normalize(cos(vec3(0,1,0)+t-.4*s));
        //Move camera back 9 units
        p.z+=9.,
        //Rotated coordinates
        a = a*dot(a,p)-cross(a,p);
        
        //Turbulence loop
        for(d=1.;d++<6.;)
            s=length(a+=cos(a*d+t).yzx/d);
        
        //Distance to rings
        z+=d=.1*(abs(sin(s-t))+abs(a.y)/d);
    }
    //Tanh tonemap
    O = tanh(O*O/2e7);
}
