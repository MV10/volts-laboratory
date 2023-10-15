#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution
#define U (fragCoord * resolution)
#define O fragColor
int iFrame = int(frame);

/*
	Created by Cornus Ammonis (2019)
	Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

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

#define C(x,y) textureLod(iChannel0, t*(U+float(1<<s)*vec2(x,y)),float(s))
void main()
{
    O = O-O;
    vec2 t = 1./iResolution.xy, q = U*t - .5;
    int s = 10;
    for (; s > 0; s--)
        O.xy -= 2.0 * vec2(C(0,1).x + C(0,-1).x, C(1,0).y + C(-1,0).y)
            -4.0 * C(0,0).xy + (C(1,-1) - C(1,1) - C(-1,-1) + C(-1,1)).yx;
    O = (C(O.x,O.y) + vec4(5e-4*q / (dot(q,q)+.01),0,0));
    
    // mix in some new content every few frames

    // frame-based which worked on Shadertoy with a video
	if(iFrame % 8 == 0)
        O = mix(texture(iChannel0, U*t), texture(iChannel1,U*t), 0.15);

	// no mixing
	//if(frame == 1)
    //    O = texture(iChannel1,U*t);
}
