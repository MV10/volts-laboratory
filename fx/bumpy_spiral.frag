#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel0 input0
#define iResolution resolution


/**
 * Created by Kamil Kolaczynski (revers) - 2016
 *
 * Licensed under Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 *
 * This shader is based on:
 *
 * - "Bumped Sinusoidal Warp" by Shane [ https://www.shadertoy.com/view/4l2XWK ]
 * - "Mobius Sierpinski" by Shane [ https://www.shadertoy.com/view/XsGXDV ]
 * - "Mobius" by dilla [ https://www.shadertoy.com/view/MsSSRV ]
 *
 * Thanks for sharing the code guys!
 * 
 * The shader was created and exported from Synthclipse (http://synthclipse.sourceforge.net/)
 */

/**
 * true - concave bumps, false - convex bumps
 * Thanks, Shane!
 */
const bool InvertNormal = true;

const float SpiralDensity = 0.2;
const float SpiralZoom = 0.5;
const int SpiralArms = 5;
const float BumpPower = 0.10150138;
const float BumpFactor = 0.0066746245;
const float LightSize = 2.9176579;
const float SampleDistance = 0.7;
const bool AntiAlias = true;

#define TWO_PI 6.2831852

vec2 cmul(vec2 a, vec2 b) {
	return a * mat2(b.x, -b.y, b.y, b.x);
}

vec2 cinv(vec2 z) {
	return vec2(z.x, -z.y) / dot(z, z);
}

vec2 cdiv(vec2 a, vec2 b) {
	return cmul(a, cinv(b));
}

vec2 mobius(vec2 z, vec2 a, vec2 b, vec2 c, vec2 d) {
	return cdiv(cmul(a, z) + b, cmul(c, z) + d);
}

vec3 tex(vec2 uv) {
	float time = iTime * 0.1;
	vec2 t = vec2(sin(time), 0.0);

	vec2 A = vec2(cos(time * 5.0), sin(time * 5.0));
	vec2 B = vec2(0.0, 0.0);
	vec2 C = t * cos(iTime * 0.25) * 10.0;
	vec2 D = vec2(1.0, 1.0);

	uv = mobius(uv, A, B, C, D);

	float arm = float(SpiralArms);
	float den = SpiralDensity;
	float zoom = SpiralZoom;
	vec2 phase = vec2(-1.0, 1.0) * iTime * 0.125;

	float a1 = atan(uv.y, uv.x) / TWO_PI;
	float a2 = atan(uv.y, abs(uv.x)) / TWO_PI;
	float d = log(length(uv));

	vec2 uvL = vec2(a1 * arm + d * den, a1 - d * zoom) + phase;
	vec2 uvR = vec2(a2 * arm + d * den, a2 - d * zoom) + phase;

	// https://iquilezles.org/articles/tunnel
	vec3 col = textureGrad(iChannel0, uvL, dFdx(uvR), dFdy(uvR)).xyz;

	col = pow(col, vec3(2.2));
	return col;
}

float intensity(vec3 p) {
	return p.x * 0.299 + p.y * 0.587 + p.z * 0.114;
}

float bump(vec2 p) {
	return pow(intensity(tex(p)), BumpPower);
}

vec3 color(vec2 p) {
	p *= 0.5;

	vec3 pos = vec3(p, 0.0);
	vec3 rd = normalize(vec3(p, 1.0));

	vec3 lig = vec3(cos(iTime) * 0.5, sin(iTime) * 0.2, -1.0) * LightSize;
	vec3 nor = vec3(0.0, 0.0, -1.0);

	vec2 eps = vec2(0.0002, 0.0);
	vec2 grad = vec2(
        	bump(pos.xy - eps.xy) - bump(pos.xy + eps.xy),
			bump(pos.xy - eps.yx) - bump(pos.xy + eps.yx)) / (2.0 * eps.xx);
    
    if (InvertNormal) {
        grad = -grad;
    }

	float r = pow(length(p), 0.1);

	nor = normalize(nor + vec3((grad), 0.0) * BumpFactor * r);
	vec3 ld = normalize(lig - pos);

	float dif = max(dot(nor, ld), 0.0);

	vec3 ref = reflect(-ld, nor);
	float spe = pow(max(dot(ref, -rd), 0.0), 32.0);

	vec3 texCol = tex(pos.xy);

	vec3 brdf = vec3(0.0);
	brdf += dif * vec3(1, 0.97, 0.92) * texCol * 0.7;
	brdf += spe * vec3(1.0, 0.6, 0.2) * 2.0;

	return clamp(brdf, 0.0, 1.0);
}

void main() {
	vec2 aspect = vec2(iResolution.x / iResolution.y, 1.0);
	vec3 col = vec3(0.0);

	if (AntiAlias) {
		float sdi = SampleDistance;
		vec2 p0 = ((fragCoord.xy + vec2(0.0, 0.0)) / iResolution.xy * 2.0 - 1.0) * aspect;
		vec2 p1 = ((fragCoord.xy + vec2(sdi, 0.0)) / iResolution.xy * 2.0 - 1.0) * aspect;
		vec2 p2 = ((fragCoord.xy + vec2(sdi, sdi)) / iResolution.xy * 2.0 - 1.0) * aspect;
		vec2 p3 = ((fragCoord.xy + vec2(0.0, sdi)) / iResolution.xy * 2.0 - 1.0) * aspect;

		col = (color(p0) + color(p1) + color(p2) + color(p3)) / 4.0;
	} else {
		col = color((fragCoord.xy / iResolution.xy * 2.0 - 1.0) * aspect);
	}
	col = pow(col, vec3(0.4545));
    
	fragColor = vec4(col, 1.0);
}