#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iFrame frame
#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution

vec4 cell(vec2 coord, vec2 pixel)
{
	vec2 uv = (coord-pixel) / iResolution.xy;
    return texture(iChannel0, uv);
}

void main()
{
    vec2 uv = fragCoord / iResolution.xy;
    
    if (iFrame < 5) // init buffer with iChannel2 texture
    {
        fragColor = texture(iChannel1, uv);
    }
    else
    {
        // get adjacents cells from backbuffer 
        vec4 l = cell(fragCoord, vec2(-1,0)); // left cell
        vec4 r = cell(fragCoord, vec2(1,0)); // rigt cell
        vec4 t = cell(fragCoord, vec2(0,1)); // top cell
        vec4 b = cell(fragCoord, vec2(0,-1)); // bottom cell
        
        // get current cell from backbuffer
        vec4 c = cell(fragCoord, vec2(0,0)); // central cell
        
        // quad dist from cells
        fragColor = max(c, max(l,max(r,max(t,b))));
        
        // video merge
        fragColor = fragColor * .95 + texture(iChannel1, uv) * .05;
	}
}
