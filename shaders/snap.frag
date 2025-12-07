#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

float hash( float n )
{
    return fract(sin(n)*43758.5453);
}

float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
}

vec3 noise3( in vec3 x)
{
	return vec3( noise(x+vec3(123.456,.567,.37)),
				noise(x+vec3(.11,47.43,19.17)),
				noise(x) );
}

//http://dept-info.labri.fr/~schlick/DOC/gem2.ps.gz
float bias(float x, float b) {
	return  x/((1./b-2.)*(1.-x)+1.);
}

float gain(float x, float g) {
	float t = (1./g-2.)*(1.-(2.*x));	
	return x<0.5 ? (x/(t+1.)) : (t-x)/(t-1.);
}

mat3 rotation(float angle, vec3 axis)
{
    float s = sin(-angle);
    float c = cos(-angle);
    float oc = 1.0 - c;
	vec3 sa = axis * s;
	vec3 oca = axis * oc;
    return mat3(	
		oca.x * axis + vec3(	c,	-sa.z,	sa.y),
		oca.y * axis + vec3( sa.z,	c,		-sa.x),		
		oca.z * axis + vec3(-sa.y,	sa.x,	c));	
}

vec3 fbm(vec3 x, float H, float L, int oc)
{
	vec3 v = vec3(0);
	float f = 1.;
	for (int i=0; i<10; i++)
	{
		if (i >= oc) break;
		float w = pow(f,-H);
		v += noise3(x)*w;
		x *= L;
		f *= L;
	}
	return v;
}

vec3 smf(vec3 x, float H, float L, int oc, float off)
{
	vec3 v = vec3(1);
	float f = 1.;
	for (int i=0; i<10; i++)
	{
		if (i >= oc) break;
		v *= off + f*(noise3(x)*2.-1.);
		f *= H;
		x *= L;
	}
	return v;	
}

#define PI 3.141592
mat2 rotationMatrix(float angle)
{
	angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, -s, 
                 s,  c );
}

// mcguirev10 - library functions
vec3 rgb2hsv(vec3 c);
vec3 hsv2rgb(vec3 c);

void main()
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	uv.x *= iResolution.x / iResolution.y;

	// mcguirev10 - rotation is fun
	uv *= rotationMatrix(time * (randomrun - 0.5) * 30.0);

	float time = iTime * 1.276;
	float slow = time * 0.002;
	uv *= 1.0 + 0.5 * slow * sin(slow * 10.0);

	float ts = time * 0.37;
	float change = gain(fract(ts), 0.0008) + floor(ts);	// flick to a different view

	vec3 p = vec3(uv * 0.2, slow + change);				// coordinate + slight change over time

	vec3 axis = 4.0 * fbm(p, 0.5, 2.0, 8);				// random fbm axis of rotation

	vec3 colorVec = 0.5 + 5.0 * fbm(p * 0.3, 0.5, 2.0, 7); // random base color
	p += colorVec;

	float mag = 0.75e5;
	vec3 colorMod = mag * smf(p, 0.7, 2.0, 8, 0.2);		// multifractal saturation

	colorVec += colorMod;

	colorVec = rotation(3.0 * length(axis) + slow * 10.0, normalize(axis)) * colorVec;

	colorVec *= 0.05;

	// counteract smf compression
	colorVec = colorVec / (1.0 + 0.00085 * length(colorMod));

	// color enhancement in HSV space
	vec3 hsv = rgb2hsv(colorVec);
	hsv.y = pow(hsv.y, 0.45);    // strong saturation boost
	hsv.z = pow(hsv.z, 0.80);    // gentle contrast
	colorVec = hsv2rgb(hsv);

	colorVec *= 1.32;            // final exposure

	colorVec = pow(colorVec, vec3(1.0 / 2.2)); // gamma

	fragColor = vec4(colorVec, 1.0);


}
