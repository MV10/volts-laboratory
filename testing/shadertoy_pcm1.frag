#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform sampler2D input0;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel1 input0
#define iChannel2 eyecandyShadertoy

// library font_v1a declarations
void init_printing(vec2 pos, float size, vec2 uv);
void newline();
void tab();
vec4 print(int i);
vec4 print(float f, int frac_digits);
vec4 print(int c[1]);
vec4 print(int c[2]);
vec4 print(int c[3]);
vec4 print(int c[4]);
vec4 print(int c[5]);
vec4 print(int c[6]);
vec4 print(int c[7]);
vec4 print(int c[8]);
vec4 print(int c[9]);
vec4 print(int c[10]);
vec4 print(int c[11]);
vec4 print(int c[12]);



#define THICKNESS 0.01

void main()
{
    // See Buffer A comments for pixel 0,0 min/max storage
    vec2 val = texelFetch(iChannel1, ivec2(0, 0), 0).rg;
    float cmin = val.r;
    float cmax = val.g;
    
    // draw the waveform
    vec2 cuv = fragCoord / iResolution.xy;
    float pcm = texture(iChannel2, vec2(cuv.x, 0.75)).g;
    float py = smoothstep(cuv.y - THICKNESS, cuv.y, pcm) - smoothstep(cuv.y, cuv.y + THICKNESS, pcm);
    fragColor = vec4(py, 0.0, 0.0, 1.0);
    
    // text overlay
    vec2 uv = 2.0*fragCoord/iResolution.xy-1.0;
    uv.y *= iResolution.y/iResolution.x;
    
    init_printing(vec2(-0.8, 0.45), 0.08, uv);

    // No good way to get library #defines into this file with the GLSL syntax extension :(
    // On my nVidia GPU the int[](xxx, xxx, xxx) constructor doesn't work, the array gets random values.

    //int[] title_txt = int[](_P, _C, _M, _SPACE,  _v, _a,  _l,  _u,  _e,  _s, _COLON);
      int[] title_txt =      {80, 67, 77,     32, 118, 97, 108, 117, 101, 115,     58};
    
    //int[] min_txt = int[](_M,  _i,  _n, _SPACE);
      int[] min_txt =      {77, 105, 110,     32};
    
    //int[] max_txt = int[](_M, _a,  _x, _SPACE);
      int[] max_txt =      {77, 97, 120,     32};

    fragColor += print(title_txt).xxxx;
    newline();
    
    fragColor += print(min_txt).xxxx;
    fragColor += print(cmin, 5).xxxx;
    newline();
    
    fragColor += print(max_txt).xxxx;
    fragColor += print(cmax, 5).xxxx;
}
