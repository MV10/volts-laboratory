#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 eyecandyShadertoy
#define iTime time


#define pi 3.14159265359

//#define iTime tan(iTime*.1)+iTime*.1

float bassBoostLow = 0.0;
float bassBoostHigh = 0.0;
float ntime = 0.0;

vec3 hsv(in float h, in float s, in float v)
{
	return mix(vec3(1.0), clamp((abs(fract(h + vec3(3, 2, 1) / 3.0) * 6.0 - 3.0) - 1.0), 0.0 , 1.0), s) * v;
}

vec3 formula(in vec2 p, in vec2 c)
{
	const float n = 2.0;
	const int iters = 5;

	//float time = iTime*0.1;
	vec3 col = vec3(0);
	float t = 1.0;
	float dpp = dot(p, p);
	float lp = sqrt(dpp);
	float r = smoothstep(0.0, 0.2, lp);
	
	for (int i = 0; i < iters; i++) {
		// The transformation
        //p+=vec2(sin(c.x+p.x)*.01,
        //        cos(c.y+p.y)*.01);
        float to = bassBoostHigh;
        float index = mod(float(i)*1234.1234, 2.0);
        
        
        if(index < .1)
        {
        	p = p*mat2(cos(cos(ntime+to)+ntime+to), -sin(cos(ntime+to)+ntime+to),
                   sin(cos(ntime+to)+ntime+to), cos(cos(ntime+to)+ntime+to));
			p = abs(mod(p*(1.0) + c, n) - (n)/2.0);
        }
        else if(index < 1.1)
			p = abs(mod(p*(1.0) + c, n) - (n)/2.0);//mod(p/dpp + c, n) - n/2.0;
        else if(index < 2.1)
			p = p+to;
		
		dpp = dot(p, p);
        p /= dpp;
		lp = pow(dpp, 1.5);
        
        
        //if(int(14.0*sin(iTime))+iters < i) break;

		//Shade the lines of symmetry black
#if 0
		// Get constant width lines with fwidth()
		float nd = fwidth(dpp);
		float md = fwidth(lp);
		t *= smoothstep(0.0, 0.5, abs((n/2.0-p.x)/nd*n))
		   * smoothstep(0.0, 0.5, abs((n/2.0-p.y)/nd*n))
		   * smoothstep(0.0, 0.5, abs(p.x/md))
		   * smoothstep(0.0, 0.5, abs(p.y/md));
#else
		// Variable width lines
		t *= smoothstep(0.0, 0.01, abs(n/2.0-p.x)*lp)
		   * smoothstep(0.0, 0.01, abs(n/2.0-p.y)*lp)
		   * smoothstep(0.0, 0.01, abs(p.x)*2.0) 
		   * smoothstep(0.0, 0.01, abs(p.y)*2.0);
#endif

		// Fade out the high density areas, they just look like noise
		r *= smoothstep(0.0, 0.2, lp);
		
		// Add to colour using hsv
		col += lp+bassBoostHigh;
		
	}
	
	col = vec3(sin(col.x+ntime*.125),
			   cos(col.y+ntime*.125+4.0*pi/3.0),
			   sin(col.z+ntime*.125+2.0*pi/3.0))*.5+.5;
    
	return col*t;
}

float lowAverage()
{
    const int iters = 32;
    float sum = 0.0;
    
    float last = length(texture(iChannel0, vec2(0.0)) * 0.07);
    float next;
    for(int i = 1; i < iters/2; i++)
    {
        next = length(texture(iChannel0, vec2(float(i)/float(iters), 0.0)) * 0.07);
        sum += last;//pow(abs(last-next), 1.0);
        last = next;
    }
    return sum/float(iters)*2.0;
}

float highAverage()
{
    const int iters = 32;
    float sum = 0.0;
    
    float last = length(texture(iChannel0, vec2(0.0)) * 0.07);
    float next;
    for(int i = 17; i < iters; i++)
    {
        next = length(texture(iChannel0, vec2(float(i)/float(iters), 0.0)) * 0.07);
        sum += last;//pow(abs(last-next), 1.0);
        last = next;
    }
    return sum/float(iters)*2.0;
}

void main() {
	vec2 p = -1.0 + 2.0 * fragCoord.xy / iResolution.xy;
    
    bassBoostLow += lowAverage()*1.0;
    bassBoostHigh += highAverage()*1.0;
    ntime = iTime+bassBoostLow*8.0*pi;
    
    p += .125;
    
    p += .5*vec2(cos(ntime), sin(ntime));
    
	p.x *= iResolution.x / iResolution.y;
	p *= 1.5+1.125*sin(ntime*.25);
    
	const vec2 e = vec2(0.06545465634, -0.05346356485);
	vec2 c = ntime*e;
	//c = 8.0*iMouse.xy/iResolution.xy;
	float d = 1.0;
	vec3 col = vec3(0.0);
	const float blursamples = 4.0;
	float sbs = sqrt(blursamples);
	float mbluramount = 1.0/iResolution.x/length(e)/blursamples*2.0;
	float aabluramount = 1.0/iResolution.x/sbs*4.0;
	for (float b = 0.0; b < blursamples; b++) {
		col += formula(
			p + vec2(mod(b, sbs)*aabluramount, b/sbs*aabluramount), 
			c + e*mbluramount*b);
	}
	col /= blursamples;
	fragColor = vec4(col, 1.0);
}