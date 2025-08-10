#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D iChannel0;
out vec4 fragColor;

#define iResolution resolution
#define iTime time

// golfing sucks
#define o fragColor
#define U (fragCoord * resolution)

// apollonian
float fractal(vec3 p) 
{
    // weight
    float w = 2.;
    
    // 6 - 8 iterations is usually the sweet spot
    for (float l, i; i++ < 4.; p *= l, w *= l )
        // sin(p), abs(sin(p))-1., also work,
        // but need to adjust weight(w) and scale(l=2.)
        p  = cos(p-.5),
        // low scale for this fractal type, so we just get snowflake-like shape
        // adjust 2. for scaling
        l = 2.1/dot(p,p);
    return length(p)/w; 
}

void main()
{
    // mcguirev10 - de-hackify Shadertoy shenanigans
    vec2 u = U;

    float i, // iterator
          
          // init total dist to a good random value (blue noise)
          // to hide some of the noise flickering
          d = .2*texelFetch(iChannel0, ivec2(u)%1024, 0).a,
          s, // signed distance
          n, // noise iterator
          t = iTime;
    // p is temporarily resolution,
    // then raymarch position
    vec3 p = vec3(iResolution, 1);
    
    // scale coords
    u = (u-p.xy/2.)/p.y;
    u += vec2(cos(t*.3)*.2, sin(t*.2)*.15);

    // clear o, up to 100, accumulate distance, grayscale color
    for(o*=i; i++<1e2;d += s = .001+abs(min(fractal(p), s))*.7,
        
        // can try below for color
         o += (1.+1.+cos(.3*p.z+vec4(6,1,3,0)))/s)
        //o += 1./s)
        
        // march, equivalent to p = ro + rd * d, p.z += d+t+t
        for (p = vec3(u * d, d+t),
             // spin by t, twist by p.z, equivalent to p.xy *= rot(.05*t+p.z*.2)
             p.xy *= mat2(cos(.02*t+p.z*.2+vec4(0,33,11,0))),
             // dist to our spiral'ish thing that will be distorted by noise
             s = sin(2.+p.y+p.x),
             // start noise at 6., until 32, grow by n*=1.41
             n = 6.; n < 32.; n *= 1.41 )
                 // subtract noise from s
                 s += abs(dot(cos(p*n), vec3(.3))) / n;
    // tanh tone mapping, divide down brightness
    o = tanh(o*o/6e8);
}
