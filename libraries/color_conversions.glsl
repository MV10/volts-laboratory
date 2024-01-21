#version 450
//
// RGB conversions:
//      HSV
//      sRGB
//      YCbCr (one-way)
//      OKLab
//
// Utilities:
//      desaturate
//      chroma-key foreground/background mixer
//      color similarity (0-maximally dissimilar, 1-identical)
//

// https://www.shadertoy.com/view/tstcDX
vec3 rgb2hsv(vec3 c)
{
    const vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    const float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// https://www.shadertoy.com/view/tstcDX
vec3 hsv2rgb(vec3 c)
{
    const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// https://www.shadertoy.com/view/ldVyRW
vec3 rgb2YCbCr(vec3 c)
{
    float Y = dot(c, vec3(.299, .587, .114));
    float Cb = .5 + dot(c, vec3(-.169, -.331, .5));
    float Cr = .5 + dot(c, vec3(.5, -.419, -.081));
	return vec3(Y, Cb, Cr);
}

// https://www.shadertoy.com/view/ldVyRW (great explanatory comments)
vec4 chromakey_mix(vec3 fg, vec3 bg, vec3 key) 
{
    vec3 ycc = rgb2YCbCr(fg);
    float dist = length((ycc - rgb2YCbCr(key)).gb);
    float mask = 1. - smoothstep(.075, .225, dist);
    vec3 gray = (1. - mask) * vec3(ycc.r);
    return vec4(mix(gray, fg - mask * key, smoothstep(.125, .275, dist)) + mask * bg, 1.); 
}

// https://bottosson.github.io/posts/colorwrong/
float __to_srgb(float x)
{
    return (x >= 0.0031308) 
        ? 1.055 * pow(x, 1.0/2.4) - 0.055 
        : 12.92 * x;
}

// https://bottosson.github.io/posts/colorwrong/
float __from_srgb(float x)
{
    return (x >= 0.04045)
        ? pow(((x + 0.055) / (1.0 + 0.055)), 2.4)
        : x / 12.92;
}

// https://bottosson.github.io/posts/colorwrong/
vec3 rgb2srgb(vec3 c)
{
    return vec3(
        __to_srgb(c.r),
        __to_srgb(c.g),
        __to_srgb(c.b));
}

// https://bottosson.github.io/posts/colorwrong/
vec3 srgb2rgb(vec3 c)
{
    return vec3(
        __from_srgb(c.r),
        __from_srgb(c.g),
        __from_srgb(c.b));
}

// https://www.shadertoy.com/view/wts3RX (using HALLEY_ITER=2)
float __cube_root(float x)
{
    float y = sign(x) * uintBitsToFloat(floatBitsToUint(abs(x)) / 3u + 0x2a514067u);
    for( int i = 0; i < 4; ++i )
    {
        float y3 = y * y * y;
        y *= ( y3 + 2. * x ) / ( 2. * y3 + x );

        // Newton's method looks like this but requires more loops for the same error level
        //y = (2.0 * y + x / (y * y)) * 0.333333333;
    }
    return y;
}

// https://bottosson.github.io/posts/oklab/
// https://www.shadertoy.com/view/wts3RX (faster, slightly less accurate)
vec3 rgb2oklab(vec3 c)
{
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
	float a = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
	float b = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

    float lr = __cube_root(l); // slower real cube root: lr = pow(l, 1.0 / 3.0)
    float ar = __cube_root(a);
    float br = __cube_root(b);

    return vec3 (
        0.2104542553 * lr + 0.7936177850 * ar - 0.0040720468 * br,
        1.9779984951 * lr - 2.4285922050 * ar + 0.4505937099 * br,
        0.0259040371 * lr + 0.7827717662 * ar - 0.8086757660 * br);
}

// https://bottosson.github.io/posts/oklab/
vec3 oklab2rgb(vec3 c)
{
    // vec3 x,y,z == L,a,b,
    float lr = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
    float ar = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
    float br = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

    float l = pow(lr, 3.0);
    float a = pow(ar, 3.0);
    float b = pow(br, 3.0);

    return vec3(
        +4.0767416621 * l - 3.3077115913 * a + 0.2309699292 * b,
		-1.2684380046 * l + 2.6097574011 * a - 0.3413193965 * b,
		-0.0041960863 * l - 0.7034186147 * a + 1.7076147010 * b);
}

// demo https://www.shadertoy.com/view/cdcBDs
// 0.0 = identical, 1.0 = maximally different (pure white vs pure black)
float color_difference(vec3 rgb1, vec3 rgb2)
{
    vec3 oklab1 = rgb2oklab(rgb1);
    vec3 oklab2 = rgb2oklab(rgb2);
    return distance(oklab1, oklab2);
}

// http://stackoverflow.com/questions/9320953/what-algorithm-does-photoshop-use-to-desaturate-an-image
vec4 desaturate(vec3 rgb, float factor)
{
	vec3 lum = vec3(0.299, 0.587, 0.114);
	vec3 gray = vec3(dot(lum, rgb));
	return vec4(mix(rgb, gray, factor), 1.0);
}