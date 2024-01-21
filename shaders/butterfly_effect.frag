#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

/* Creative Commons Licence Attribution-NonCommercial-ShareAlike 
   phreax 2021
*/

#define PI 3.141592
#define SIN(x) (sin(x)*.5+.5)
#define hue(v) ( .6 + .6 * cos( 6.3*(v) + vec3(0,23,21) ) )

float tt;

mat2 rot2(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }

// from "Palettes" by iq. https://shadertoy.com/view/ll2GD3
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 getPal(int id, float t) 
{
    id = id % 7;

    vec3          col = pal( t, vec3(.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,-0.33,0.33) );
    if( id == 1 ) col = pal( t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.10,0.20) );
    if( id == 2 ) col = pal( t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.3,0.20,0.20) );
    if( id == 3 ) col = pal( t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,0.5),vec3(0.8,0.90,0.30) );
    if( id == 4 ) col = pal( t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,0.7,0.4),vec3(0.0,0.15,0.20) );
    if( id == 5 ) col = pal( t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );
    if( id == 6 ) col = pal( t, vec3(0.8,0.5,0.4),vec3(0.2,0.4,0.2),vec3(2.0,1.0,1.0),vec3(0.0,0.25,0.25) );
    
    return col;
}

// by Nusan
float curve(float t, float d) {
  t/=d;
  return mix(floor(t), floor(t)+1., pow(smoothstep(0.,1.,fract(t)), 10.));
}

vec3 transform(vec3 p) {
    float a = PI*.5*curve(iTime, 4.);
    
    // rotate object
    p.xz *= rot2(a);
    p.xy *= rot2(a);
    return p;
}

float map(vec3 p) {

    vec3 bp = p;

    p = transform(p);

    //p.x *= 1.+SIN(curve(iTime, 4.))*(smoothstep(-0.9, 0.9, -p.y));
    //p.z *= 1.+.5*(smoothstep(-0.9, 1.5, -p.y));

    p.x = abs(p.x) -.5*SIN(tt*.5);
    p.y = abs(p.y) -.9*SIN(tt*.8);
    p.y -= 0.1;
    p.y = abs(p.y) -.1;
    p.x -= 0.2;
    p.x = abs(p.x) -.9; 
    p.z = abs(p.z) -.5;

    p.zy -= 0.5;
    p.xy *= rot2(0.1*tt);
    p.zy *= rot2(-.04*tt);

    // torus
    float r1 = 1.0;
    float r2 = mix(0.03, 0.3, SIN(iTime));
    
    vec2 cp = vec2(length(p.xz) - r1, p.y);
    vec2 cp2 = cp;
    
    // torus knots by BigWings
    float a = atan(p.z, p.x);
    cp *= rot2(3.*a+tt);
    cp.x = abs(cp.x) - .3;
    cp *= rot2(3.*a);

    // kifs
    float n = 10.;
    for(float i = 0.; i< n; i++) {
    
        cp.y = abs(cp.y) -.05*(.5*sin(tt)+.9);
        
        cp *= rot2(0.1*a*sin(0.1*iTime));
        cp -= i*0.01/n;
    }

    float d = length(cp) - r2;
  
    return .4*d;
}

void main() 
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    
    float cz = -5.+1.5*sin(curve(iTime, 4.));
    
    vec3 ro = vec3(0, .0, cz),
         rd = normalize(vec3(uv, .7));
         
    vec3 p = ro;
    vec3 col;
    
    float t, d = 0.1;
    
    tt = iTime;  
    tt = tt+2.*curve(tt, 2.);
    
    float acc = 0.0;
    for(float i=.0; i<200.; i++) {
    
        d = map(p);
        
        if(d < 0.0001 || t > 100.) break;
        
        // Phantom mode https://www.shadertoy.com/view/MtScWW
        d = max(abs(d), 0.009);
        acc += 0.07;
        
        t += d;
        p += rd*d;
    }
       
    if(d < 0.001) {
        col += acc*clamp(1., 0., 1.2*abs(cz)/(t*t));
          
        float sl = dot(p,p);
        col *= 0.5*getPal(4, 1.-0.1*sqrt(sl)+0.05*p.z+.25*iTime+curve(iTime, 8.));
    }
    
    col = pow(col, vec3(1.2))*1.4;
   
    fragColor = vec4(col, 1.0 - t * 0.3);
}
