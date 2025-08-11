#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define R resolution
#define iTime time

// golfing sucks
#define O fragColor
#define U (fragCoord * resolution)

#define rot(x) mat2(cos(x+vec4(0,11,33,0)))

//Rodrigues-Euler axis angle rotation
#define ROT(p,axis,t) mix(axis*dot(p,axis),p,cos(t))+sin(t)*cross(p,axis)

//formula for creating colors;
#define H(h,id)  (  cos( h*2.*cos(iTime/2.+length(id)) + 40.*vec3(1,2,.3)   )*.6 + .5 )

#define H2(h)  (  cos(  h/2. + vec3(3,2,1)   )*.7 + .2 )

//formula for mapping scale factor 
#define M(c)  log(1.+c)

void main()
{
  
    O = vec4(0);
    
    vec3 c=vec3(0);
    vec4 rd = normalize( vec4(U-.5*R.xy, .5*R.y, R.y))*300.;
    
    float sc,dotp,totdist=0., tt=iTime/7., t=iTime/2.;
    
    for (float i=0.; i<120.; i++) {
        
        vec4 p = vec4( rd*totdist);
        p.xyz += vec3(.5*sin(t),.5*cos(t/2.),-1.+sin(t/5.)); 
        p.xz *= rot( tt/2. + sin(tt));
        p.yzw = ROT(p.xyz,normalize(vec3(cos(t/2.),sin(t/3.),sin(t/5.))),t/2.);
        p.xw  =  sin(p.xw);
        
        vec2  id = (p.xw);
        
        sc = 1.; 
     
        vec4 w = p;
        
        for (float j=0.; j<5.; j++) {
         
            p = abs(p)*.6;
       
            dotp = max(1./dot(w,w),.3);
            sc *= dotp; 
            
            p = p * dotp - .45; 
            
            w = .9*log(1.+log(1.+log(1.+p)*p)*p) - vec4(.3,.1,.2,.3); 
        }
         
        float dist = abs( length(p)-.1)/sc ;  //funky distance estimate
        float stepsize = dist/15. ;     
        totdist += stepsize;                  //move the distance along rd
        
        //accumulate color, fading with distance and iteration count
        c +=
            0.02* H2(  atan( p.w, p.z )) * exp(-i*i*1e-3)
             + .04 * mix( vec3(1), H(M(sc),id),.95) * exp(-i*i*stepsize*stepsize*2e4);
    }
    
    c = 1. - exp(-c*c);
    O = ( vec4(c,0) );
}
