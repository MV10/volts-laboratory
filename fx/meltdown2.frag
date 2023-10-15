#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iChannel0 input1
#define iResolution resolution

/*
	For long-time Shadertoyers, you may notice that this bears a striking
	resemblance to Florian Berger's "Spilled" shader here: 
		https://www.shadertoy.com/view/MsGSRd

	I've used the same visualization code for the sake of comparison
	(and of course convenience).

	In the spite of the visual similarity, the CFD algorithm itself bears 
	nothing at all in common at first glance. Nonetheless, the resemblance
	is not a coincidence. This is not at all obvious without some fairly
	deep analysis, but Florian's shader and mine are actually both 
	approximations of the same distribution, which boils down to sums of
    second partial derivatives, which can be found here in the viscous stress 
	portion of the filtered Navier-Stokes equations:
	https://en.wikipedia.org/wiki/Large_eddy_simulation

	I may be wrong on this relation to Navier-Stokes, tell me if you
	know otherwise.

	At any rate, benchmarking this using Shadertoy Unofficial Plugin, here:
		https://github.com/patuwwy/ShaderToy-Chrome-Plugin
	it can run at about 2400fps at 800x450, which is the default resolution 
	for me without going in fullscreen, or about 1100fps at 1200x675 on a 980Ti
	(64x paint calls). Pretty good! It runs well at 4K widescreen, but I'm not 
	sure how to benchmark that in a browser.
*/

// This license applies to the visualization code below:
/* 
	Created by florian berger (flockaroo) - 2016
	License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

float getVal(vec2 uv)
{
    return length(texture(iChannel0,uv).xyz);
}
    
vec2 getGrad(vec2 uv,float delta)
{
    vec2 d=vec2(delta,0);
    return vec2(
        getVal(uv+d.xy)-getVal(uv-d.xy),
        getVal(uv+d.yx)-getVal(uv-d.yx)
    )/delta;
}

void main()
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    vec3 n = vec3(getGrad(uv,1.0/iResolution.y),120.0);
    //n *= n;
    n=normalize(n);
    fragColor=vec4(n,1);
    vec3 light = normalize(vec3(1,1,2));
    float diff=clamp(dot(n,light),0.5,1.0);
    float spec=clamp(dot(reflect(light,n),vec3(0,0,-1)),0.0,1.0);
    spec=pow(spec,36.0)*1.0;
    //spec=0.0;
	fragColor = texture(iChannel0,uv)*vec4(diff)+vec4(spec);
}