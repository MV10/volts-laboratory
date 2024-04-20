#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 eyecandyShadertoy

// mcguirev10 - Shadertoy iMouse is really vec4 but this only uses xy
#define iMouse (texture(iChannel0, vec2(0.1, 0.25)).g * resolution)

#define USEPALETTE
#ifdef USEPALETTE
vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.5, 0.5, 0.5);

    return a + b * cos(6.28318*(c*t+d) );
}
#endif

vec3 hsb2rgb( in vec3 c )
{
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return (c.z * mix( vec3(1.0), rgb, c.y));
}

// customizable color from @WhiteTophat  in https://www.shadertoy.com/view/dlBczW
vec4 lerp(vec4 a, vec4 b, float t) {
    return (a * vec4(t)) + (b * vec4(1.0-t));
}
vec4 lerp(vec4 a, vec4 b, vec4 t) {
    return (a * t) + (b * (vec4(1.0) * t));
}

vec4 hue2rgb(float hue) {
    hue = fract(hue); //only use fractional part of hue, making it loop
    float r = abs(hue * 6.0 - 3.0) - 1.0; //red
    float g = 2.0 - abs(hue * 6.0 - 2.0); //green
    float b = 2.0 - abs(hue * 6.0 - 4.0); //blue
    vec4 rgb = vec4(r,g,b, 1.0); //combine components
    rgb = clamp(rgb, 0.0, 1.0); //clamp between 0 and 1
    return rgb;
}

vec4 hsv2rgb(vec3 hsv) {
    vec4 rgb = hue2rgb(hsv.x); //apply hue
    rgb = lerp(vec4(1.0), rgb, 1.0 - hsv.y); //apply saturation
    rgb = rgb * hsv.z; //apply value
    return rgb;
}

// simple mouse rotate and zoom for shader
#define pi 3.14159265359 
mat2 r2d(float a) {
    return mat2(cos(a),sin(a),-sin(a),cos(a));
}

vec2 mouseRotZoom(vec2 uv) {
    // allow mouse zoom and rotate    
    vec2 mouse = (iMouse.xy == vec2(0.)) ? vec2(1.0) : iMouse.xy/iResolution.xy;
    uv.xy *= r2d(-(mouse.x)*pi*2.);
    uv *= (1./(1.0*mouse.y));
    return uv;
}

void main() 
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    vec4 mouseColor;
    if(iMouse.xy!=vec2(0.)) {
      vec2 mouseUV = iMouse.xy / iResolution.xy;
      mouseColor = hsv2rgb(vec3(mouseUV.x, mouseUV.y, 1.0));
      fragColor *= mouseColor;
    } else {
      mouseColor = vec4(1.);
    }
    
    uv = mouseRotZoom(uv);
    
    for (float i = 0.0; i < 4.0; i++) {
        //tweak fractal subdivision and center, respectively
        uv = fract(uv * 2.0) ; // - 0.5 in the end

        float d = length(uv) * exp(-length(uv0));

#ifdef USEPALETTE
        vec3 col = mouseColor.rgb * hsb2rgb(palette(length(uv) + i*0.4 + iTime));
#else
        vec3 col = mouseColor.rgb * hsb2rgb(vec3(length(uv0) + i*0.4 + iTime,0.9,0.9));
#endif

        d = sin(d*8.0 + iTime*2.)/8.0;
        d = abs(d);

        //tweak power parameter to rise contrast
        d = pow(0.01 / d, 1.0);

        finalColor += col * d;
    }
    
    fragColor = vec4(finalColor, 1.0);
}