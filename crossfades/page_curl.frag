#version 450
precision highp float;

// Adapted from https://www.shadertoy.com/view/lstGWN
// My revisions https://www.shadertoy.com/view/XclXWM

in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

uniform float fadeLevel;
uniform vec2 resolution;
uniform float randomrun;
#define fragCoord (fragCoord * resolution)
#define iResolution resolution

vec2 getDragPosition()
{
    float x = fadeLevel * (iResolution.x * 2.0);
    float y = fadeLevel * iResolution.y * (randomrun + 0.25);
    return vec2(x, y);
}

bool swap_x = false; 

const float pi = 3.14159;
const float twopi = 6.28319;

const float e0 = 0.018;
const float ppow = 2.0;

const float bcolorMix = 0.67;
const float maxBcolVal = 0.4;

const float diffint = 1.2;
const float ambientt = 0.1;
const float ambientb = 0.4;

const vec2 specpos = vec2(0.85, -0.2);
const float specpow = 5.;
const float specwidth = 0.4;
const float specint = 0.6;

const vec2 shadowoffset = vec2(0.07, -0.04);
const float shadowsmoothness = 0.012;
const float shadowint = 0.65;

const float aawidth = 0.7;
const int aasamples = 3;

float random(float co) // or not, lol
{
    return fract(sin(co * 12.989) * 43758.545);
}

vec4 getPagebackColor()
{
    float cn = 1.0;
    vec4 pagebackColor;
    pagebackColor.r = maxBcolVal*random(cn + 263.714);
    pagebackColor.g = maxBcolVal*random(cn * 4.0 - 151.894);
    pagebackColor.b = maxBcolVal*random(cn * 7.0 + 87.548);
    pagebackColor.a = 1.0;
    return pagebackColor;
}

vec2 rotateVec(vec2 vect, float angle)
{
    float xr = vect.x * cos(angle) + vect.y * sin(angle);
    float yr = vect.x * sin(angle) - vect.y * cos(angle);
    return vec2(xr, yr);
}

float pageFunction(float x, float e)
{
    return pow(pow(x, ppow) - e, 1.0 / ppow);
}

float pageFunctionDer(float x, float e)
{
    return pow(x, ppow - 1.)/pow(pow(x, ppow) - e, (ppow - 1.)/ppow);
}

vec4 turnPage(vec2 coord)
{
    vec2 uv = coord.xy / iResolution.yy;
    float ratio = iResolution.x/iResolution.y;

    vec2 Mouse2 = getDragPosition();
    if(swap_x) Mouse2.x = iResolution.x - Mouse2.x;

    vec2 mpoint = Mouse2.xy;

    vec2 midmpoint = mpoint * 0.5;
    float mdist = distance(coord, mpoint);
    float e = e0 * pow(mdist / iResolution.y, 2.0) + 0.02 * e0 * smoothstep(0.0, 0.12, mdist / iResolution.y);
    float angle = -atan(mpoint.x / mpoint.y) + pi * 0.5;

    vec2 uv2 = uv;
    if(swap_x) uv2.x = ratio - uv2.x;

    vec2 uvr = rotateVec(uv2 - midmpoint / iResolution.yy, angle);

    float pagefunc = pageFunction(uvr.x, e);
    vec2 uvr2 = vec2(pagefunc, uvr.y); 
    vec2 uvr3 = rotateVec(uvr2, -angle) - vec2(1., -1.) * midmpoint / iResolution.yy;
    vec2 uvr2b = vec2(-pagefunc, uvr.y); 
    vec2 uvr3b = rotateVec(uvr2b, -angle) - vec2(1.0, -1.0) * midmpoint / iResolution.yy;

    if(swap_x) uvr3b.x = ratio - uvr3b.x;

    vec4 i; 
    // Turned page
    if (uvr.x > 0.0 && uvr3b.y > 0.0)
    {
        vec2 uvcorr = vec2(ratio, 1.0);
        vec2 uvrcorr = rotateVec(uvcorr - midmpoint / iResolution.yy, angle);
        float pagefunccorr = pageFunction(uvrcorr.x, e);
        vec2 uvrcorr2 = vec2(-pagefunccorr, uvrcorr.y); 
        vec2 uvrcorr3 = rotateVec(uvrcorr2, -angle) - vec2(1.0, -1.0) * midmpoint / iResolution.yy;

        float pagefuncder = pageFunctionDer(uvr.x, e);
        float intfac = 1.0 - diffint*(1.0 - 1.0 / pagefuncder);

        if(uvr3.x >= 0.0 || uvr3.y <= 0.0)
        {
            // Top of the turned page           
        	float mdists = distance(coord, mpoint) * 0.7 - 55.0;
        	float es = e0 * pow(mdists / iResolution.y, 2.0) + 0.02 * e0 * smoothstep(0.0, 0.08, mdist / iResolution.y);
        	vec2 uvrs = rotateVec(uv2 - midmpoint / iResolution.yy - shadowoffset, angle);
        	float pagefuncs = pageFunction(uvrs.x + 0.015, es - 0.001);
        	vec2 uvr2s = vec2(pagefuncs, uvrs.y); 
        	vec2 uvr3s = rotateVec(uvr2s, -angle) - vec2(1.0, -1.0) * midmpoint / iResolution.yy;
        	float shadow = 1.0 - (1.0 - smoothstep(-shadowsmoothness, shadowsmoothness, uvr3s.x)) * (1.0 - smoothstep(shadowsmoothness, -shadowsmoothness, uvr3s.y));

            float difft = intfac * (1.0 - ambientt) + ambientt;
        	difft = difft * (shadow*shadowint + 1.0 - shadowint) / 2.0 + mix(1.0 - shadowint, difft, shadow) / 2.0;
            i = difft * (texture(oldBuffer, mod((uvr3b - uvrcorr3) / vec2(-ratio, 1.0), 1.0)));
        }
        else
        {
            // Bottom of the turned page
            float diffb = intfac * (1.0 - ambientb) + ambientb;
        	float spec = pow(smoothstep(specpos.x - 0.35, specpos.x, intfac) * smoothstep(specpos.x + 0.35, specpos.x, intfac), specpow);
        	spec *= specint * pow(1.0 - pow(clamp(abs(uvr.y - specpos.y), 0.0, specwidth * 2.0), 2.0) / specwidth, specpow);
            i = diffb * (mix(texture(oldBuffer, mod((uvr3 - uvrcorr3) / vec2(-ratio, 1.0), 1.0)), getPagebackColor(), bcolorMix));
         	i = mix(i, vec4(1.0), spec);
        }
    }
    else
    {
        // "Background" with simple shadow
        vec2 backgroundUV = fragCoord.xy / iResolution.xy;
        i = texture(newBuffer, backgroundUV);

        float bgshadow = 1.0 + shadowint * smoothstep(-0.08 + shadowsmoothness * 4.0, -0.08, uvr3b.y) - shadowint;
        if (uvr3b.y < 0.0)
           i *= bgshadow;
    }
    return i;
}

void main()
{
    // On AMD, has a one-frame flash of the new buffer at the start.
    // 0.003 is the fadeLevel step at 60 FPS for 5 sec.
    if(fadeLevel <= 0.003)
    {
        fragColor = texture(oldBuffer, fragCoord / resolution);
        return;
    }

    // Antialiasing
    vec4 vs = vec4(0.);
    for (int j = 0; j < aasamples; j++)
    {
       float oy = float(j) * aawidth / max(float(aasamples - 1), 1.0);
       for (int i=0; i < aasamples; i++)
       {
          float ox = float(i) * aawidth / max(float(aasamples - 1), 1.0);
          vs += turnPage(fragCoord + vec2(ox, oy));
       }
    }
    
    fragColor = vs / vec4(aasamples * aasamples);    
}
