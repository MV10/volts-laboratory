#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input0

#define REFRACTION_INDEX 1.5
#define BASE_DEPTH 100.0
#define HEIGHT_FACTOR 100.0
#define HEIGHT_FACTOR2 10.0
#define VIEW_DISTANCE_FACTOR 100.0
#define HIGHLIGHT 3.0

float gray(vec4 pix)
{
    return 0.333 * (pix.r + pix.g + pix.b);
}

void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    
    //versors in uv space
    vec2 nu = vec2(1.0/iResolution.x, 0.0);
    vec2 nv = vec2(0.0, 1.0/iResolution.y);
    
    vec4 pix = texture(iChannel0, uv);
    float h = gray(pix);
    
    vec2 surface_gradient = vec2(
      //  dFdx(h),dFdy(h)
     	    gray(texture(iChannel0, uv + nu)) - gray(texture(iChannel0, uv - nu)), // dh/dx
            gray(texture(iChannel0, uv + nv)) - gray(texture(iChannel0, uv - nv)) // dh/dy
    );
    
    // GLSL refraction
    // first we need to compute the surface normal
    vec3 normal = normalize(vec3(surface_gradient*HEIGHT_FACTOR2, 1.0));
    vec3 incident = normalize(vec3(fragCoord-iResolution.xy/2.0, -iResolution.x*VIEW_DISTANCE_FACTOR));
    vec2 exit_vector = refract(incident, normal, 1.0/REFRACTION_INDEX).xy;
    
    vec2 exit_displacement = exit_vector*((BASE_DEPTH + h*HEIGHT_FACTOR2*HEIGHT_FACTOR)/iResolution.xy);
    
    float highlight = 1.0 + dot(vec2(0.707,0.707), surface_gradient)*HIGHLIGHT;
    
    fragColor.rgb = texture(iChannel0, uv + exit_displacement).rgb * highlight;
    fragColor.a = 1.0;
}
