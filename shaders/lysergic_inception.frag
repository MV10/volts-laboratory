#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution

#define o fragColor

#define F float
#define V vec2
#define W vec3
#define N normalize
#define L length
#define rot(x) mat2(cos(x),-sin(x),sin(x),cos(x))
#define S(x) sin((x)+2.*sin((x)+4.*sin(x)))
#define col(x) (x-cos((x-W(.8,.1,.5 ))*6.283)*.5+.5)

void main() 
{
	o-=o;
	vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
	uv -= 0.5;
	uv /= vec2(iResolution.y / iResolution.x, 1.);

	F e=1.,i=0.,d=0.;
	W P,p,rd=N(W(uv,1));
	for(;i++<99.&&e>.0001;){
		P=p=rd*d+.001;
		V stp=V(2.+.05*S(S(time+P.z)),1.);
		
		p.xz*=rot(S(time)*.1);
		p.xy*=rot(S(time*.317)*.1);
		p.z-=1.-time*.2;
		p.xy*=rot(S(time*.7+P.z));
		p.x+=stp.x/2.;
		p.y+=sin(time*.1)*6.;
		
		F ss=2.,s;
		p.xz=mod(p.xz+stp/2.,stp)-stp/2.;
		for(F j=0.;j<13.;j++){
			p=abs(p);
			p-=W(.5,2.,.5);
			ss*=s=2.3/clamp(dot(p,p),.3,1.1);
			p*=s;
			p-=W(0,2,0);
		}
		d+=e=(L(p)-1.)/ss;
	}
	F c=1.-i/99.;
	o+=c;
	o.rgb*=col(cos(1.+L(P*4.))*.5+.5);
}
