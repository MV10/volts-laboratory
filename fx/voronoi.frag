#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

//2013, George Toledo. Based on tons of glsl sandbox code with additions to make it a filter.
//change lightMode and mess with N to change lighting. displaceMode lets cell noise be affected by texture brightness.
//distance formula sets up a mix between linear and manhattan.
//webGL and desktop both seem to optimize all conditional stuff fine on this computer.

//webGL v0.1 Sep. 3, 2013 (desktop, 4/2/13)
//webGL v0.2 Sep. 3, 2013 (desktop, 4/2/13). - set uv in main
//webGL v0.3 Sep. 3, 2013 (desktop, 4/5/13). - adjust for vid

#define density 75.00
#define displaceMode 1
#define displaceAmt .75
#define lightMode 2
//distFormula 0 is linear, 1 is manhattan, you can mix between
#define distFormula 0.0
#define uvOffset vec2(0.07,0.02)
#define zoom 0.01
//N vec4(0.) for no holes on facet
//#define N vec4(0.0,0.0,0.0,0.)
#define N vec4(sin(iTime))

float jitter;

float jit(float jitter, float lum){
if (displaceMode==0)
return jitter=lum*displaceAmt;//more jitter in brighter areas
else if (displaceMode==1)
return jitter=1.-lum*displaceAmt;//more jitter in darker areas
else
return jitter=displaceAmt;//disregard texture in jitter creation
}

//uses cellular noise for jitter basis

// Cellular noise ("Worley noise") in 2D in GLSL.
// Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
// This code is released under the conditions of the MIT license.
// See LICENSE file for details, located in ZIP file here:
// http://webstaff.itn.liu.se/~stegu/GLSL-cellular/

// Permutation polynomial: (34x^2 + x) mod 289
vec3 permute(vec3 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}
// Cellular noise, returning F1 and F2 in a vec2.
// Standard 3x3 search window for good F1 and F2 values
vec2 cellular(vec2 P, float jitter, float lum) {
#define K 0.142857142857 // 1/7
#define Ko 0.428571428571 // 3/7

	vec2 Pi = mod(floor(P), 289.0);
 	vec2 Pf = fract(P);
	vec3 oi = vec3(-1.0, 0.0, 1.0);
	vec3 of = vec3(-0.5, 0.5, 1.5);
	vec3 px = permute(Pi.x + oi);
	vec3 p = permute(px.x + Pi.y + oi); // p11, p12, p13
	vec3 ox = fract(p*K) - Ko;
	vec3 oy = mod(floor(p*K),7.0)*K - Ko;
	vec3 dx = Pf.x + 0.5 + jit(jitter, lum)*ox;
	vec3 dy = Pf.y - of + jit(jitter, lum)*oy;
	
	vec3 d1 = mix(dx * dx + dy * dy,  abs(dx) + abs(dy), distFormula); // d11, d12 and d13, squared, mixed with not squared
	p = permute(px.y + Pi.y + oi); // p21, p22, p23
	ox = fract(p*K) - Ko;
	oy = mod(floor(p*K),7.0)*K - Ko;
	dx = Pf.x - 0.5 + jit(jitter, lum)*ox;
	dy = Pf.y - of + jit(jitter, lum)*oy;
	vec3 d2 = mix(dx * dx + dy * dy,  abs(dx) + abs(dy), distFormula); // d21, d22 and d23, squared
	p = permute(px.z + Pi.y + oi); // p31, p32, p33
	ox = fract(p*K) - Ko;
	oy = mod(floor(p*K),7.0)*K - Ko;
	dx = Pf.x - 1.5 + jit(jitter, lum)*ox;
	dy = Pf.y - of + jit(jitter, lum)*oy;
	vec3 d3 = mix(dx * dx + dy * dy,  abs(dx) + abs(dy), distFormula); // d31, d32 and d33, squared
	// Sort out the two smallest distances (F1, F2)
	vec3 d1a = min(d1, d2);
	d2 = max(d1, d2); // Swap to keep candidates for F2
	d2 = min(d2, d3); // neither F1 nor F2 are now in d3
	d1 = min(d1a, d2); // F1 is now in d1
	d2 = max(d1a, d2); // Swap to keep candidates for F2
	d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx; // Swap if smaller
	d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx; // F1 is in d1.x
	d1.yz = min(d1.yz, d2.yz); // F2 is now not in d2.yz
	d1.y = min(d1.y, d1.z); // nor in  d1.z
	d1.y = min(d1.y, d2.x); // F2 is in d1.y, we're done.
	return mix(sqrt(d1.xy),d1.xy,distFormula);
}

vec2 cellularID(vec2 P, float jitter, float lum) {
	vec2 Pi = mod(floor(P), 289.0);
 	vec2 Pf = fract(P);
	vec3 oi = vec3(-1.0, 0.0, 1.0);
	vec3 of = vec3(-0.5, 0.5, 1.5);
	vec3 px = permute(Pi.x + oi);
	vec3 p = permute(px.x + Pi.y + oi); // p11, p12, p13
	vec3 ox = fract(p*K) - Ko;
	vec3 oy = mod(floor(p*K),7.0)*K - Ko;
	vec3 dx = Pf.x + 0.5 + jit(jitter, lum)*ox;
	vec3 dy = Pf.y - of + jit(jitter, lum)*oy;
	vec3 d1 = mix(dx * dx + dy * dy,  abs(dx) + abs(dy), distFormula); // d11, d12 and d13, squared, mixed with not squared
	p = permute(px.y + Pi.y + oi); // p21, p22, p23
	ox = fract(p*K) - Ko;
	oy = mod(floor(p*K),7.0)*K - Ko;
	dx = Pf.x - 0.5 + jit(jitter, lum)*ox;
	dy = Pf.y - of + jit(jitter, lum)*oy;
	vec3 d2 = mix(dx * dx + dy * dy,  abs(dx) + abs(dy), distFormula); // d21, d22 and d23, squared
	p = permute(px.z + Pi.y + oi); // p31, p32, p33
	ox = fract(p*K) - Ko;
	oy = mod(floor(p*K),7.0)*K - Ko;
	dx = Pf.x - 1.5 + jit(jitter, lum)*ox;
	dy = Pf.y - of + jit(jitter, lum)*oy;
	vec3 d3 = mix(dx * dx + dy * dy,  abs(dx) + abs(dy), distFormula); // d31, d32 and d33, squared
  
  	float f1 = d1.x;
	vec2 ci = vec2(Pi.x - 1.0, Pi.y - 1.0);
	if (d1.y < f1) { f1 = d1.y; ci = vec2(Pi.x - 1.0, Pi.y); }
	if (d1.z < f1) { f1 = d1.z; ci = vec2(Pi.x - 1.0, Pi.y + 1.0); }
	if (d2.x < f1) { f1 = d2.x; ci = vec2(Pi.x      , Pi.y - 1.0); }
	if (d2.y < f1) { f1 = d2.y; ci = vec2(Pi.x      , Pi.y); }
	if (d2.z < f1) { f1 = d2.z; ci = vec2(Pi.x      , Pi.y + 1.0); }
	if (d3.x < f1) { f1 = d3.x; ci = vec2(Pi.x + 1.0, Pi.y - 1.0); }
	if (d3.y < f1) { f1 = d3.y; ci = vec2(Pi.x + 1.0, Pi.y); }
	if (d3.z < f1) { f1 = d3.z; ci = vec2(Pi.x + 1.0, Pi.y + 1.0); }
	return mod(ci, 289.0);
}

vec3 hsv(const in float h, const in float s, const in float v) {
	return mix(vec3(1.),clamp((abs(fract(h+vec3(3.,2.,1.)/3.)*6.-3.)-1.),0.,1.),s)*v;
}

void main()
{
	vec2 uv = (fragCoord.xy / iResolution.xy)*(1.-zoom)+uvOffset;
	//vec2 uv=(2.-vec2(-fragCoord.x,fragCoord.y)/iResolution.xy)*(1.-zoom)+uvOffset;
	vec4 tx=texture(iChannel0,uv);
	float lum=length(tx.rgb);

	vec2 position = uv * density;
	vec2 Fid = cellularID(position, jitter, lum);
	vec4 tx2=texture(iChannel0,Fid/density); 
 	vec2 F = cellular(position, jitter, lum);
	vec2 Fx = cellular(position-vec2(0.05,0.0), jitter, lum);
	vec2 Fy = cellular(position-vec2(0.0,0.05), jitter, lum);

 	
 	float nBasic = 0.1+(F.y-F.x);

	float facets = 0.1+abs(F.y*(N.x+N.y)-F.x);
	float facetsX = 0.1+abs(Fx.y*(N.x+N.z)-Fx.x);
	float facetsY = 0.1+abs(Fy.y*(N.x+N.w)-Fy.x);
    
	vec3 normalFacet = vec3(facets - facetsX, facets - facetsY, 0.1);
    vec4 fc = vec4(-dot(normalize(normalFacet),normalize(vec3((uv)-.5,-1.0))));

	if(lightMode==0){
	vec3 color = vec3(tx2.rgb);
	fragColor = vec4( color, 1.0);
	}
	else if(lightMode==1){
	vec3 color = vec3(tx2.rgb) * nBasic;	
	fragColor = vec4( color, 1.0);
	}
	else if(lightMode==2){
	vec3 color = vec3(tx2.rgb) * fc.rgb;	
	fragColor = vec4( color, 1.0);
	}	
	else if(lightMode==3){
	vec3 color = normalize(normalFacet)+.5;	
	fragColor = vec4( color, 1.0);
	}
}
