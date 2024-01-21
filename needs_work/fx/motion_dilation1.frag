#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel0 input0
#define iChannel1 inputB
#define iResolution resolution

//Generate UV Offset

#define F vec3(.2126, .7152, .0722)

float normpdf(in float x, in float sigma)
{
	return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;
}

void main()
{
    vec2 uv = fragCoord / iResolution.xy;
	const int mSize = 11;
	const int kSize = (mSize-1)/2;
	float kernel[mSize];
    float detect;
    vec2 vector;
	float sigma = 7.0;
	float Z = 0.0;
	for (int j = 0; j <= kSize; ++j)
	{
			kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j), sigma);
	}
    for (int j = 0; j < mSize; ++j)
    {
        Z += kernel[j];
    }
    for (int i=-kSize; i <= kSize; ++i)
    {
        for (int j=-kSize; j <= kSize; ++j)
        {
            vec3 col = texture(iChannel0,(fragCoord.xy + vec2(float(i),float(j))) / iResolution.xy).rgb;
            float gray = pow(dot(col, F),0.5);
            detect += kernel[kSize+j]*kernel[kSize+i] * gray;
        }
    }
	
	detect = pow(detect/(Z*Z), 5.);
    vector = vec2(dFdx(detect), dFdy(detect));
	vec2 combine = mix( vector , texture(iChannel1,uv + vector ).rg, .9);
    fragColor = vec4(combine,0.,0.);
}