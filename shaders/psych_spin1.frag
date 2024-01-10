#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform float time;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iFrame frame
#define iTime time
#define iChannel0 input0

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

//First bloom pass, mipmap tree thing

vec3 ColorFetch(vec2 coord)
{
 	return texture(iChannel0, coord).rgb;   
}

vec3 Grab1(vec2 coord, const float octave, const vec2 offset)
{
 	float scale = exp2(octave);
    
    coord += offset;
    coord *= scale;

   	if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0)
    {
     	return vec3(0.0);   
    }
    
    vec3 color = ColorFetch(coord);

    return color;
}

vec3 Grab4(vec2 coord, const float octave, const vec2 offset)
{
 	float scale = exp2(octave);
    
    coord += offset;
    coord *= scale;

   	if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0)
    {
     	return vec3(0.0);   
    }
    
    vec3 color = vec3(0.0);
    float weights = 0.0;
    
    const int oversampling = 4;
    
    for (int i = 0; i < oversampling; i++)
    {    	    
        for (int j = 0; j < oversampling; j++)
        {
			vec2 off = (vec2(i, j) / iResolution.xy + vec2(0.0) / iResolution.xy) * scale / float(oversampling);
            color += ColorFetch(coord + off);
            

            weights += 1.0;
        }
    }
    
    color /= weights;
    
    return color;
}

vec3 Grab8(vec2 coord, const float octave, const vec2 offset)
{
 	float scale = exp2(octave);
    
    coord += offset;
    coord *= scale;

   	if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0)
    {
     	return vec3(0.0);   
    }
    
    vec3 color = vec3(0.0);
    float weights = 0.0;
    
    const int oversampling = 8;
    
    for (int i = 0; i < oversampling; i++)
    {    	    
        for (int j = 0; j < oversampling; j++)
        {
			vec2 off = (vec2(i, j) / iResolution.xy + vec2(0.0) / iResolution.xy) * scale / float(oversampling);
            color += ColorFetch(coord + off);
            

            weights += 1.0;
        }
    }
    
    color /= weights;
    
    return color;
}

vec3 Grab16(vec2 coord, const float octave, const vec2 offset)
{
 	float scale = exp2(octave);
    
    coord += offset;
    coord *= scale;

   	if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0)
    {
     	return vec3(0.0);   
    }
    
    vec3 color = vec3(0.0);
    float weights = 0.0;
    
    const int oversampling = 16;
    
    for (int i = 0; i < oversampling; i++)
    {    	    
        for (int j = 0; j < oversampling; j++)
        {
			vec2 off = (vec2(i, j) / iResolution.xy + vec2(0.0) / iResolution.xy) * scale / float(oversampling);
            color += ColorFetch(coord + off);
            

            weights += 1.0;
        }
    }
    
    color /= weights;
    
    return color;
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

void main()
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    
    
    vec3 color = vec3(0.0);
    
    /*
    Create a mipmap tree thingy with padding to prevent leaking bloom
   	
	Since there's no mipmaps for the previous buffer and the reduction process has to be done in one pass,
    oversampling is required for a proper result
	*/
    color += Grab1(uv, 1.0, vec2(0.0,  0.0)   );
    color += Grab4(uv, 2.0, vec2(CalcOffset(1.0))   );
    color += Grab8(uv, 3.0, vec2(CalcOffset(2.0))   );
    color += Grab16(uv, 4.0, vec2(CalcOffset(3.0))   );
    color += Grab16(uv, 5.0, vec2(CalcOffset(4.0))   );
    color += Grab16(uv, 6.0, vec2(CalcOffset(5.0))   );
    color += Grab16(uv, 7.0, vec2(CalcOffset(6.0))   );
    color += Grab16(uv, 8.0, vec2(CalcOffset(7.0))   );


    fragColor = vec4(color, 1.0);
}
