#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
uniform sampler2D input1;
uniform sampler2D input2;
uniform sampler2D input3;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iFrame frame
#define iTime time
#define iChannel0 input0
#define iChannel1 input1
#define iChannel2 input2
#define iChannel3 input3

vec3 HUEtoRGB(in float hue);
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d );
vec3 saturate(vec3 x);
vec3 firePalette(float i);
float sminP(in float a, in float b , float s);
float smin0( float a, float b, float k );
vec3 sphericalToCartesian(vec3 p);
vec3 cartestianToSpherical(vec3 p);
mat2 rotate2d(float _angle);
float hash11( float n );
vec2 hash22( vec2 p );
vec3 hash13(float n);
float sdPlane( vec3 p );
float sdSphere( vec3 p, float s );
float sdBox( vec3 p, vec3 b );
float sdEllipsoid( in vec3 p, in vec3 r );
float sdRoundBox( in vec3 p, in vec3 b, in float r ) ;
float sdTorus( vec3 p, vec2 t );
float sdHexPrism( vec3 p, vec2 h );
float sdCapsule( vec3 p, vec3 a, vec3 b, float r );
float sdRoundCone( in vec3 p, in float r1, float r2, float h );
float dot2(in vec3 v );
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2);
float sdEquilateralTriangle(  in vec2 p );
float sdTriPrism( vec3 p, vec2 h );
float sdCylinder( vec3 p, vec2 h );
float sdCylinder(vec3 p, vec3 a, vec3 b, float r);
float sdCone( in vec3 p, in vec3 c );
float dot2( in vec2 v );
float sdCappedCone( in vec3 p, in float h, in float r1, in float r2 );
float sdOctahedron(vec3 p, float s);
float length2( vec2 p );
float length6( vec2 p );
float length8( vec2 p );
float sdTorus82( vec3 p, vec2 t );
float sdTorus88( vec3 p, vec2 t );
float sdCylinder6( vec3 p, vec2 h );
float opS( float d1, float d2 );
vec2 opU( vec2 d1, vec2 d2 );
vec3 opRep( vec3 p, vec3 c );
vec3 opTwist( vec3 p );

// bloom from https://www.shadertoy.com/view/lstSRS

vec4 cubic(float x)
{
    float x2 = x * x;
    float x3 = x2 * x;
    vec4 w;
    w.x =   -x3 + 3.0*x2 - 3.0*x + 1.0;
    w.y =  3.0*x3 - 6.0*x2       + 4.0;
    w.z = -3.0*x3 + 3.0*x2 + 3.0*x + 1.0;
    w.w =  x3;
    return w / 6.0;
}

vec4 BicubicTexture(in sampler2D tex, in vec2 coord)
{
	vec2 resolution = iResolution.xy;

	coord *= resolution;

	float fx = fract(coord.x);
    float fy = fract(coord.y);
    coord.x -= fx;
    coord.y -= fy;

    fx -= 0.5;
    fy -= 0.5;

    vec4 xcubic = cubic(fx);
    vec4 ycubic = cubic(fy);

    vec4 c = vec4(coord.x - 0.5, coord.x + 1.5, coord.y - 0.5, coord.y + 1.5);
    vec4 s = vec4(xcubic.x + xcubic.y, xcubic.z + xcubic.w, ycubic.x + ycubic.y, ycubic.z + ycubic.w);
    vec4 offset = c + vec4(xcubic.y, xcubic.w, ycubic.y, ycubic.w) / s;

    vec4 sample0 = texture(tex, vec2(offset.x, offset.z) / resolution);
    vec4 sample1 = texture(tex, vec2(offset.y, offset.z) / resolution);
    vec4 sample2 = texture(tex, vec2(offset.x, offset.w) / resolution);
    vec4 sample3 = texture(tex, vec2(offset.y, offset.w) / resolution);

    float sx = s.x / (s.x + s.y);
    float sy = s.z / (s.z + s.w);

    return mix( mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
}

vec3 ColorFetch(vec2 coord)
{
 	return texture(iChannel0, coord).rgb;   
}

vec3 BloomFetch(vec2 coord)
{
 	return BicubicTexture(iChannel3, coord).rgb;   
}

vec3 Grab(vec2 coord, const float octave, const vec2 offset)
{
 	float scale = exp2(octave);
    
    coord /= scale;
    coord -= offset;

    return BloomFetch(coord);
}

vec2 CalcOffset(float octave)
{
    vec2 offset = vec2(0.0);
    
    vec2 padding = vec2(10.0) / iResolution.xy;
    
    offset.x = -min(1.0, floor(octave / 3.0)) * (0.25 + padding.x);
    
    offset.y = -(1.0 - (1.0 / exp2(octave))) - padding.y * octave;

	offset.y += min(1.0, floor(octave / 3.0)) * 0.35;
    
 	return offset;   
}

vec3 GetBloom(vec2 coord)
{
 	vec3 bloom = vec3(0.0);
    
    //Reconstruct bloom from multiple blurred images
    bloom += Grab(coord, 1.0, vec2(CalcOffset(0.0))) * 1.0;
    bloom += Grab(coord, 2.0, vec2(CalcOffset(1.0))) * 1.5;
	bloom += Grab(coord, 3.0, vec2(CalcOffset(2.0))) * 1.0;
    bloom += Grab(coord, 4.0, vec2(CalcOffset(3.0))) * 1.5;
    bloom += Grab(coord, 5.0, vec2(CalcOffset(4.0))) * 1.8;
    bloom += Grab(coord, 6.0, vec2(CalcOffset(5.0))) * 1.0;
    bloom += Grab(coord, 7.0, vec2(CalcOffset(6.0))) * 1.0;
    bloom += Grab(coord, 8.0, vec2(CalcOffset(7.0))) * 1.0;

	return bloom;
}

void main()
{
    
    vec2 uv = fragCoord.xy / iResolution.xy;
    
    vec3 color = ColorFetch(uv);
    
    
    color += GetBloom(uv) * 0.12;
    
    color *= 2.0;
    

    //Tonemapping and color grading
    color = pow(color, vec3(1.5));
    color = color / (1.0 + color);
    color = pow(color, vec3(1.0 / 1.5));

    
    color = mix(color, color * color * (3.0 - 2.0 * color), vec3(1.0));
    color = pow(color, vec3(1.3, 1.20, 1.0));    

	color = saturate(color * 1.01);
    
    color = pow(color, vec3(0.7 / 2.2));

    fragColor = vec4(color, 1.0);
   // fragColor = texture(iChannel1, uv) * 10111.;

}
