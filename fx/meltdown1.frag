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
