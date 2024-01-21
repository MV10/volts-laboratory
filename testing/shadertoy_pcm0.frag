#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iFrame frame
#define iChannel0 eyecandyShadertoy
#define iChannel1 inputA


// pixel 0,0 stores the min/max data over time in the R and G channels

void main()
{
    fragColor = vec4(0.0);
    
    // bail out after pixel 0,0
    if(fragCoord.y > 0.5 || fragCoord.x > 0.5) 
        return;
    
    // initialize or reset min/max to limits; using iFrame == 0 seems
    // to pick up bad data (both min and max are near their limits); note
    // originally I mistakenly assumed the range was -1.0 to 1.0, but it's
    // really 0.0 to 1.0 ... no big deal, still works this way
    if(iFrame < 5)
    {
        fragColor = vec4(1.0, -1.0, 1.0, 1.0);
        return;
    }

    // find the current audio min/max
    float amin =  1.1;
    float amax = -1.1;
    for(int x = 0; x < 1024; x++)
    {
        float pcm = texelFetch(iChannel0, ivec2(x, 1), 0).g;
        amin = min(amin, pcm);
        amax = max(amax, pcm);
    }
    
    // compare to previous frame min/max and store
    vec2 val = texelFetch(iChannel1, ivec2(0,0), 0).rg;
    float cmin = min(val.r, amin);
    float cmax = max(val.g, amax);
    fragColor = vec4(cmin, cmax, 1.0, 1.0);
}
