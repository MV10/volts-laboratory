#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iFrame frame
#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution

void main()
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec4 new=texture(iChannel1,uv);
	vec4 old=(iFrame==0?texture(iChannel1, uv):texture(iChannel0, uv+((normalize(texture(iChannel0, uv)).xy)*2.-1.)/-200.));
	fragColor = normalize(mod(pow(old+new/10.,vec4(1.05)),1.))*.999;
}