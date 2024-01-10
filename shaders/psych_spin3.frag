#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform float time;
uniform sampler2D input2;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iFrame frame
#define iTime time
#define iChannel0 input2

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

//Vertical gaussian blur leveraging hardware filtering for fewer texture lookups.

vec3 ColorFetch(vec2 coord)
{
 	return texture(iChannel0, coord).rgb;   
}

float weights[5];
float offsets[5];

void main()
{    
    
    weights[0] = 0.19638062;
    weights[1] = 0.29675293;
    weights[2] = 0.09442139;
    weights[3] = 0.01037598;
    weights[4] = 0.00025940;
    
    offsets[0] = 0.00000000;
    offsets[1] = 1.41176471;
    offsets[2] = 3.29411765;
    offsets[3] = 5.17647059;
    offsets[4] = 7.05882353;
    
    vec2 uv = fragCoord.xy / iResolution.xy;
    
    vec3 color = vec3(0.0);
    float weightSum = 0.0;
    
    if (uv.x < 0.52)
    {
        color += ColorFetch(uv) * weights[0];
        weightSum += weights[0];

        for(int i = 1; i < 5; i++)
        {
            vec2 offset = vec2(offsets[i]) / iResolution.xy;
            color += ColorFetch(uv + offset * vec2(0.0, 0.5)) * weights[i];
            color += ColorFetch(uv - offset * vec2(0.0, 0.5)) * weights[i];
            weightSum += weights[i] * 2.0;
        }

        color /= weightSum;
    }

    fragColor = vec4(color,1.0);
}
