#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iMouse vec4(0)

#define iterations 17
#define formuparam 0.53

#define volsteps 20
#define stepsize 0.1

#define zoom   0.800
#define tile   0.850
#define speed  0.000 

#define brightness 0.0015
#define darkmatter 0.300
#define distfading 0.730
#define saturation 0.850
#define H(a) (cos(radians(vec3(100, 140, 190))-((a)*6.2832))*.5+.5) // hue pallete
#define RT(a) mat2(cos(m.a*1.571+vec4(0,-1.571,1.571,0))) // rotate

void mainVR( out vec4 fColor, in vec2 fCoord, in vec3 ro, in vec3 rd )
{
	//get coords and direction
	vec3 dir=rd;
	vec3 from=ro;
	
	//volumetric rendering
	float s=0.1,fade=1.;
	vec3 v=vec3(0.);
	for (int r=0; r<volsteps; r++) {
		vec3 p=from+s*dir*.5;
		p = abs(vec3(tile)-mod(p,vec3(tile*2.))); // tiling fold
		float pa,a=pa=0.;
		for (int i=0; i<iterations; i++) { 
			p=abs(p)/dot(p,p)-formuparam;
            p.xy*=mat2(cos(iTime*0.02),sin(iTime*0.02),-sin(iTime*0.02),cos(iTime*0.02));// the magic formula
			a+=abs(length(p)-pa); // absolute sum of average change
			pa=length(p);
		}
		float dm=max(0.,darkmatter-a*a*.001); //dark matter
		a*=a*a; // add contrast
		if (r>6) fade*=1.-dm; // dark matter, don't render near
		//v+=vec3(dm,dm*.5,0.);
		v+=fade;
		v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; // coloring based on distance
		fade*=distfading; // distance fading
		s+=stepsize;
	}
	v=mix(vec3(length(v)),v,saturation); //color adjust
	fColor = vec4(v*.03,1.);	
}

float cheap_star(vec2 uv, float anim)
{
    uv = abs(uv);
    vec2 pos = min(uv.xy/uv.yx, anim);
    float p = (2.0 - pos.x - pos.y);
    return (2.0+p*(p*p-1.5)) / (uv.x+uv.y);      
}

mat2 rotationMatrix(float angle)
{
angle *= 3.14 / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, s, -s, c );
}

vec2 rotate(vec2 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

void main()
{
	//get coords and direction
	vec2 uv=fragCoord.xy/iResolution.xy-.5;
	uv.y*=iResolution.y/iResolution.x;
     float t = iTime * .1 + ((.25 + .05 * sin(iTime * 1.1))/(length(uv.xy) + .122)) * 1.2;
float si = sin(t);
float co = cos(t);
mat2 ma = mat2(co, si, -si, co);
uv*=ma;
	vec3 dir=vec3(uv*zoom,1.);
	float time=iTime*speed+.25;
    vec4 C =fragColor;
    vec2 U = fragCoord;
    
vec3  c = vec3(0), 
          o = vec3(1 ,1.732, 1),
          u, v, a, b;
    vec2  R = iResolution.xy,
          m = iMouse.xy/R*4.-2.,
          uv2 = (U-.5*R)/R.y; // 2d coords
    float t2 = iTime/5.,
          tr = smoothstep(0., 1., sin(t)*.6+.5),
          s = tr*4.+2., // scale
          h;

    //if (iMouse.z < 1.)
    //{
        // mcguirev10 - tweak rotation time with the beat
        float fft = texture(eyecandyShadertoy, vec2(0.07, 0.25)).g;
        t2 = (time + (fft - 0.45)) / 5.0;

        m = vec2(sin(t2/2.)*.6, sin(t2)*.4); // rotate with time
    //}

    mat2  pitch = RT(y),
          yaw = RT(x);
    for (float i = .1; i < 1.; i+=.1)
    {
        u = normalize(vec3(uv, .7*sqrt(i)))*s; // 3d coords
        u.yz *= pitch;
        u.xz *= yaw;
        
        // add distortion
        u.xy += sin(uv.yx*20.0+t)*0.1;
        u.xz += sin(uv.yx*30.0+t)*0.2;
        u.yz += sin(uv.yx*10.0+t)*0.15;
        
        // simple hexagonal tiles by lomateron https://www.shadertoy.com/view/MlXyDl
        a = mod(u, o)*2.-o;
        b = mod(u+o*.5, o)*2.-o;
        h = min(dot(a, a), dot(b, b))*.5;
        
        v = h*h*H(i-t/5.);
        float k = 1.2-max(i, tr-i); // increase contrast
        c += v*k;
    }
    // add more color
    c *= vec3(1.0, 0.8, 1.2);
    c = pow(c, vec3(2.5)) * 0.5 + 0.05;
    C = vec4(c, 1);
	vec3 from=vec3(1.,.5,0.5);
	from+=vec3(time*2.,time,-2.);
	  uv *= 2.0 * ( cos(iTime * 2.0) -2.5);
    
    // anim between 0.9 - 1.1
    float anim = sin(iTime * 12.0) * 0.1 + 1.0;    

	mainVR(fragColor, fragCoord, from, dir);	
    fragColor*=vec4(C);
     fragColor*= vec4(cheap_star(uv,anim) * vec3(0.55,0.5,0.55)*2.1, 1.0);
}
