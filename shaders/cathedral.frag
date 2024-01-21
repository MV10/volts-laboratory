#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define U (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 eyecandyShadertoy

// mcguirev10 - audio is why we're here
#define iTime (time + texture(eyecandyShadertoy, vec2(0.02, 0.5)).g)

#define H(a) (cos(radians(vec3(0, 60, 120))+(a)*6.2832)*.5+.5)  // hue

#define PI 3.141592
mat2 rotationMatrix(float angle)
{
	angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, -s, 
                 s,  c );
}

void main()
{
    float t = iTime / 300., // num sec between ints
          n = 6.2832,     // pi2
          s = 6.,         // scale
          i, p, r, k;
    
    vec2 R = iResolution.xy,
         q = s*cos(t*2.*n - vec2(0, n/4.)), // circle movement
         
         // mcguirev10 - no mouse here, stick with something simple
         m = s*vec2(sin(t*n)*2., sin(t*n*2.)), // fig-8 movement

         v = (U+U-R)/R.y;                   // cartesian coords

    // mcguirev10 - rotation makes everything better
    v *= rotationMatrix(time * (randomrun - 0.5) * 30.0);

    k = dot(v, v); // transformed coords
    r = length(v); // screen y radius
    
    vec3 c = vec3(0),
         d = H(t*10. + r/2.)*.07; // color
    
    for(i = 0.; i < 1.; i += .2)
    {
        vec2 u = i*v*s/k - m,       // transformed coords
             o = vec2(.5, .866),    // hex offset
             a = mod(u,   o+o) - o, // grid 1
             b = mod(u-o, o+o) - o, // grid 2
             h = dot(a,a) < dot(b,b) ? a : b, // combine grids for hex tile
             k = abs(h);
        
        p = pow(length(u-h), 2.)*t; // pattern (radial moire)
        
        c = max(c, (1.-max(k.x, dot(k, o))*3.) // hex tile
          * (sin(p*n)/2.+1.)     // brightness pattern
          * (H(p+.5)*.5+.5)      // color pattern
          * min(r*sqrt(r), 1./r) // darken center & edges
          * pow(i, .1)           // darken hex near camera
          * (1.3-r)              // flip outer
          + d);                  // more color
    }
    
    fragColor = vec4(c+c*c*8., 1);
}