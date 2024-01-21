#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iChannel0 eyecandyShadertoy

float shard, ssoft;
float t,as;

vec3 fractal(vec2 p) {
    p=vec2((atan(p.x,p.y)*3.14),length(p)*.5-1.);
    p+=1.+as*.5;
    p.x=fract(p.x*.1-t*.5+ssoft*.05);
    vec2 m=vec2(1000);
    float ml=100.;
    for (int i=0; i<3; i++) {
        p=abs(p)/clamp(abs(p.x*p.y),.1+floor(mod(time*.2,5.))/10.,.7)-2.;
        m = min(m, abs(p))+fract(p.x*.5+ssoft*3.+time*.4)+fract(p.y*.5+time*.4);
        ml=min(ml,length(p));;
    }
    m=exp(-2.*m);
    vec3 c=vec3(m.x*10.,length(m*3.),m.y*5.);
   // c=c.rgg;
    ml=exp(-7.*ml)*2.;
    c+=ml;
    return c;
}

float getSound() 
{
    float s=0.;
    for (float i=0.; i<20.; i++) {
        s+=texture(iChannel0,vec2(0.,i/20.)).g * 0.7;
        s+=texture(iChannel0,vec2(i/20.,0.)).g * 0.7;
    }
    return s/20.;
}

void main()
{
    vec3 c=vec3(0.);
    float ss=.4+abs(fract(time*.2))*.7;
    as = getSound();

    shard = ss*ss*ss;
    ssoft = ss;
    vec2 uv = -1. + 2. * fragCoord.xy/resolution.xy;
    t=time*.3;
    float s=sin(time/4.);
    uv+=vec2(sin(t),cos(t))*.3;
    uv*=1.3+tan(ss*4.)*.1;
    //uv.x*=1./pow(abs(s), .6)*sign(s);
    uv.x*=resolution.x/resolution.y;
    //uv=uv.yx;
 //   uv*=.7;
    //t*=.5+floor(length(uv)*6)*.1;
    t+=smoothstep(.0,.2,fract(length(uv*.5)-time*.5));
 //   uv*=1.+exp(-3*length(uv))*spectrum.x*100;
    //uv=abs(.5-fract(uv));
    c+=fractal(uv);
    c+=max(0.,1.1-length(uv)*shard*5.);
    //c=mix(c,texture(prevFrame,gl_FragCoord.xy/resolution).rgb,.8);
    //c*=step(length(uv),3.);
    //c*=mod(length(uv),.5)*5.;
    fragColor = vec4(c, 1.0);//*mod(gl_FragCoord.y,10.)*.1;
}

