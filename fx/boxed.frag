#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

/**
RAYMARCHING ALGORITHM
from  Ray Marching: Part 2 by jfwong : https://www.shadertoy.com/view/lt33z7
from  Raymarching - Primitives by iq : https://www.shadertoy.com/view/Xds3zN
*/
const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;
const float PI = 3.141592653589793;

float dot2( in vec3 v ) { return dot(v,v); }

float sdPlane( vec3 p ){
	return p.y;
}

float sdSphere( vec3 p, float s ){
    return length(p)-s;
}

float sdBox( vec3 p, vec3 b ){
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float opU( float d1, float d2 ) {
	return min(d1,d2);
}

struct Ray {
    vec3 origin;
    vec3 direction;
};

/**
 * Return the normalized direction to march in from the eye point for a single pixel.
 * 
 * fieldOfView: vertical field of view in degrees
 * size: resolution of the output image
 * coord: the x,y coordinate of the pixel in the output image
 */
vec3 rayDirection(float fieldOfView, vec2 size, vec2 coord) {
    vec2 xy = coord - size * 0.5;
    float z = size.y / tan(radians(fieldOfView) * 0.5);
    return normalize(vec3(xy, z));
}

/**
 * Signed distance function describing the scene.
 * 
 * Absolute value of the return value indicates the distance to the surface.
 * Sign indicates whether the point is inside or outside the surface,
 * negative indicating inside.
 */
float sceneSDF(vec3 samplePoint) {
    float res = 1e10;

    // mcguirev10 - remove the distracting objects on the "floor" of the scene; maybe do something with them later?
    //res = opU(res, sdSphere(samplePoint-vec3(1.0,0.5,-1.), 0.5));
    //res = opU(res, sdBox(samplePoint-vec3(-1.0,0.5,1.), vec3(0.5,0.5,0.5)));
    
    // mcguirev10 - original was 2.0, 3.0 fills the screen
    float size=3.;
    
    float thickness=0.01;
    res = opU(res, sdBox(samplePoint-vec3(0.0,0.0,0.0),vec3(size,thickness,size)));
    res = opU(res, sdBox(samplePoint-vec3(0.0,2.*size,0.0),vec3(size,thickness,size)));
    res = opU(res, sdBox(samplePoint-vec3(-size,size,0.0),vec3(thickness,size,size)));
    res = opU(res, sdBox(samplePoint-vec3(size,size,0.0),vec3(thickness,size,size)));
    res = opU(res, sdBox(samplePoint-vec3(0.0,size,size),vec3(size,size,thickness)));
    return res;
}

/**
 * Using the gradient of the SDF, estimate the normal on the surface at point p.
 */
vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

/**
 * Return the shortest distance from the eyepoint to the scene surface along
 * the marching direction. If no part of the surface is found between start and end,
 * return end.
 * 
 * eye: the eye point, acting as the origin of the ray
 * marchingDirection: the normalized direction to march in
 * start: the starting distance away from the eye
 * end: the max distance away from the ey to march before giving up
 */
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) {
			return depth;
        }
        depth += dist;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}

///////////////////////////////////////////////////////////
//SOME MATHS FOR ROTATIONS
/////////////////////////////////////////////////////

// taken from https://www.shadertoy.com/view/WtjcDt
mat3 rotationMatrix(vec3 axis, float cosAngle, float sinAngle) {
    float s = sinAngle;
    float c = cosAngle;
    float oc = 1.0 - c;
    
    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
}

mat3 rotationMatrix(vec3 axis, float angle) {
    // taken from http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
    // angle = radians(angle);
    //axis = normalize(axis);
    float c = cos(angle);
    float s = sin(angle);
    return rotationMatrix(axis, c, s);
}

//taken from https://www.shadertoy.com/view/WtjcDt
vec3 apply_rot(mat3 r, vec3 p) {
    return r*p;
}

vec3 rotateVectorFromRef(vec3 view, vec3 direction, vec3 refDirection) {
    vec3 axis = cross(refDirection,direction);
    float sinAngle = length(axis);
    float cosAngle = dot(refDirection,direction);
    axis /= sinAngle;
    mat3 mat = rotationMatrix(axis, cosAngle, sinAngle);
    return apply_rot(mat,view);
}

///////////////////////////////////////////////////////////
// LIGHTS
///////////////////////////////////////////////////////////

vec3 cart2sph(vec3 cart) {
    // cartesian z is up
    //sph is radius, inclination (from z), azimuth
    vec3 sph = cart*cart;
    sph.y = sph.x+sph.y;
    sph.x = sqrt(sph.z+sph.y);
    sph.y = atan(sqrt(sph.y), cart.z);
    sph.z = atan(cart.y, cart.x);
    sph.z = mod(sph.z,2.*PI);
    return sph;
}

vec3 sph2cart(vec3 sph) {
    // cartesian z is up
    // sph is radius, inclination (from z), azimuth
    vec3 cart;
    cart.x = sin(sph.y);
    cart.z = sin(sph.z);
    cart.y = cart.x * cart.z * sph.x;
    cart.z = cos(sph.z);
    cart.x *= cart.z * sph.x;
    cart.z = cos(sph.y) * sph.x;
    return cart;
}

vec3 sphericalProjectorForImg(vec3 view, sampler2D img) {
    vec3 sph = cart2sph(view.zxy);
    //azimuth is at z maps to uv x, inclination is at y and maps to uv y
    // and scale to [0,1[
    vec2 uv = sph.zy / vec2(2.*PI,PI); 
    return texture(img, uv).xyz;
    //return vec3(floor(8.*uv.xy)/8.,0.);
}

vec3 sphericalProjectorForCubemap(vec3 view, samplerCube img) {
    return texture(img, view.xzy).xyz;
}

////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////

void main()
{
    vec3 camPos = vec3(0.,2.,-6.);
    float camFov = 90.0;
    Ray ray = Ray(camPos, rayDirection(camFov, iResolution.xy, fragCoord));
    // compute intersection of camera ray with the scene
    float dist = shortestDistanceToSurface(ray.origin,ray.direction, MIN_DIST, MAX_DIST);
    if (dist > MAX_DIST - EPSILON) {
        // Didn't hit anything
        fragColor = vec4(0.0,0.0,0.0, 1.0);
        return;
    }
    vec3 hitPoint = ray.origin + dist * ray.direction;
    vec3 hitPointNormal = estimateNormal(hitPoint);
    // adds a first point light on the camera so that we can still see things even outside of the second light range
    //vec3 col = vec3(1.0)*dot(hitPointNormal, -ray.direction)/(dist*dist);
    vec3 col = vec3(0.);
    
    // set the light properties of the second point light
    vec3 lightPos = vec3(0.0,2.0,0.0);
    float lightLum = 3.;
    
    
    // user driven light

    //ray = Ray(camPos, rayDirection(camFov, iResolution.xy, iMouse.xy));
    ray = Ray(camPos, rayDirection(camFov, iResolution.xy, vec2(0)));

    dist = shortestDistanceToSurface(ray.origin,ray.direction, MIN_DIST, MAX_DIST);
    vec3 mouseHit = ray.origin + dist * ray.direction;
    vec3 lightAxis = normalize(lightPos-mouseHit);
    //vec3 lightAxis = vec3(0.,1.,0.); // for debug
    
    // animated light
    //if (length(iMouse.xy) < 20.) {
        lightAxis = normalize(vec3(1.0,cos(iTime),sin(iTime*0.5)));
    //}
   
    vec3 dirToLight = lightPos-hitPoint;
    float distToLight = length(dirToLight);
    dirToLight = dirToLight/distToLight;
    
    // compute intersection of light ray with geometry and then the light intensity
    ray = Ray(lightPos, -dirToLight);
    dist = shortestDistanceToSurface(ray.origin,ray.direction, MIN_DIST, MAX_DIST);
    if (abs(dist - distToLight) < 0.001) {
        col += 
        lightLum // the light radiance
        
         // use a texture for the intensity distribution
        * sphericalProjectorForImg(rotateVectorFromRef(dirToLight,lightAxis,vec3(0.,0.,-1.)), iChannel0)
        //* sphericalProjectorForImg(dirToLight, iChannel0) // cuncomment for default behaviour
         // uncomment to use a cubemap instead
        //* sphericalProjectorForCubemap(-dirToLight.xyz, iChannel1)
        //* sphericalProjectorForCubemap(rotateVectorFromRef(dirToLight,lightAxis,vec3(0.,-1.,0.)), iChannel1)

        // because it is a point light, we need to convert to irradiance
        * dot(hitPointNormal, dirToLight)/(distToLight*distToLight);
    }
    
    // Output to screen
    //fragColor = vec4((hitPointNormal+1.)*0.5, 1.);
    fragColor = vec4(pow(col,vec3(0.45)),1.0);
}
