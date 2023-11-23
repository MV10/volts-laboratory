#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel1 eyecandyShadertoy
#define iTime time

highp vec4 freqs;
    
highp vec3 dstepf = vec3(0.0);
    
const vec2 RMPrec = vec2(0.2, 0.15); 
const vec3 DPrec = vec3(1e-3, 12., 1e-8); 

highp float Density = randomrun * 10.0 + 1.0;

vec4 map(vec3 p)
{
    vec4 col = vec4(p,1.);
    vec2 i = col.xz*Density;
    i=i/col.y+iTime;
    i-=col.xy=ceil(i+=i.x*=.577);
    col.xy+=step(1.,col.z=mod(col.x+col.y,3.))-step(2.,col.z)*step(i,i.yx);
    col.z=0.;
    col=.5+.5*sin(col);
    
    col *= freqs;
    
    dstepf += 0.02 * col.rgb;

    float disp = dot(col,vec4(0.5));
      
    float dist = length(p) -4. + smoothstep(0., 1., disp);
    
    return vec4(dist, col.rgb);
}

vec3 cam(vec2 uv, vec3 ro, vec3 cu, vec3 cv)
{
	vec3 rov = normalize(cv-ro);
    vec3 u =  normalize(cross(cu, rov));
    vec3 v =  normalize(cross(rov, u));
    vec3 rd = normalize(rov + u*uv.x + v*uv.y);
    return rd;
}

void main()
{
    vec2 si = iResolution.xy;
    
    float t = iTime;
    
    freqs.x = texture( iChannel1, vec2( 0.02, 0.55 ) ).g;
	freqs.y = texture( iChannel1, vec2( 0.07, 0.55 ) ).g;
	freqs.z = texture( iChannel1, vec2( 0.15, 0.55 ) ).g;
	freqs.w = texture( iChannel1, vec2( 0.30, 0.55 ) ).g;
    
    fragColor = vec4(0.);
    float ca = t*.2; // angle z
    float ce = 5.7; // elevation
    float cd = 0.5; // distance to origin axis

    vec2 uv = (fragCoord+fragCoord-si)/min(si.x, si.y);
    vec3 ro = vec3(sin(ca)*cd, ce+1., cos(ca)*cd); //
    
    vec3 rov = normalize(vec3(0,0,0)-ro);
    vec3 u =  normalize(cross(vec3(0,1,0), rov));
    vec3 v =  normalize(cross(rov, u));
    vec3 rd = normalize(rov + u*uv.x + v*uv.y);
    
    vec3 d = vec3(0.);
    vec3 p = ro+rd*d.x;
    float s = DPrec.y;
    float rmd = sign(map(p).x);
    for(int i=0;i<250;i++)
    {      
		if(s<DPrec.x||s>DPrec.y) break;
        s = map(p).x*(s>DPrec.x?RMPrec.x:RMPrec.y);
        if (sign(s) != rmd) break;
        d.y = d.x;
        d.x += s;
        p = ro+rd*d.x;
   	}

    float countIter = 0.;
    if (sign(s) == rmd)
    {
    	p = ro+rd*d.x;
        rmd = map(p).x;
        for (int i = 0; i < 20; i++)
        {
        	countIter += 10.;
            d.z = (d.x + d.y)*.5;
            p = ro+rd*d.z;
            s = map(p).x*RMPrec.y;
            d.x += abs(s);
            if (abs(s) < DPrec.z)break;
            (d.x*rmd < 0. )? (d.x = d.z ): (d.y = d.z);
       	}
        d.x = (d.x+d.y) * .5;
   	}
    
    fragColor = vec4(dstepf,1);
}
