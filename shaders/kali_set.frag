#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define r(p, a) {p = cos(a) * p + sin(a) * vec2(p.y, -p.x);}
float fftsmooth(float a, sampler2D s)
{
    //from nick shelton
    //FFT_smooth_n = FFTRaw_n * alpha + FFT_smooth_n-1 * (1 - alpha)
    float audio = texture(s, vec2(.5)).g;
    return audio * a + audio-1. * (1.-a);
}

#define PSD fftsmooth(.5, eyecandyShadertoy)

float trap = 0.;

float map(vec3 pos)
{
	vec4 p = vec4(pos, 1.);
	float d = 100.;
	for (int i = 0; i < 5; i++)
	{
        // Kali set formula: abs(p) / dot(p, p)
		p = abs(p)/clamp(dot(p,p), -1., 1.)-vec4(1., 1.3, .6, .4);
		r(p.xz, time + PSD);
		r(p.yz, time + PSD);
		r(p.xy, time + PSD);
		
		d = min(d, length(p.x*p.y*p.z*p.w)-.5);
        
        // Alternate formula using code from https://www.shadertoy.com/view/XsGXWc
		//d = min(d, sin(p.x*p.y*p.z));
		
		trap = distance(p, vec4(0.));
	}
	return d;
}

vec3 calcNormal(vec3 p)
{
	vec2 e = vec2(0.005, 0);
	return normalize(vec3(map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx)));
}

void main()
{

	vec2 uv = fragCoord - 0.5;
    
    // Fun effect to go with the fractal from https://www.shadertoy.com/view/XtSGDK
    //#define DEFORM
    #ifdef DEFORM
    float r2 = dot(uv, uv);
    uv /= r2;
    #endif
    
	vec3 ro = vec3(uv, 1.);
	vec3 rd = normalize(vec3(uv, -1.));
	
	float t = 0.;
	for (int i = 0; i < 100; i++)
	{
		float m = map(ro + rd * t);
		t+=m;
		if (t > 40. || m < 0.02) break;
	}
	
	if (t > 40.)
	{
		fragColor = vec4(0.);
		return;
	}
	
	vec3 p = ro + rd * t;
	vec3 n = calcNormal(p);
	
	vec3 lp = vec3(1., 3., 5.);
	vec3 ld = lp - p;
	float len = length(ld);
	ld /= len;
	float diff = max(dot(ld, n), 0.);
	float atten = min(1., 1./len);
	float amb = .25;
	float spec = pow(max(dot(normalize(ro-p), reflect(-ld, n)), 0.), 8.);
	
	vec3 col = vec3(trap, trap*trap, pow(trap, 4.)) * ((diff+amb)+spec)*atten;
	
	col /= abs(sin(vec3(.5, .2, .9) + col + time + PSD));
	fragColor = vec4( col, 1.0 );
}