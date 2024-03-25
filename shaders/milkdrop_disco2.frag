#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D input1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel1 input0
#define iChannel2 input1

///////////////////////////////////////////////
// Same for each pass (and #define won't work from a library)
    //#define BufA(x, y) texture(iChannel1, (vec2(x, y) + 0.5) / iResolution.xy)
    //#define BufA(x, y) texture(iChannel1, (vec2(x, y) + 0.1) / iResolution.xy)
    //#define BufA(x, y) texture(iChannel1, vec2(x, y) / iResolution.xy)
    #define BufA(x, y) texelFetch(iChannel1, ivec2(x, y), 0)

    #define GET_BASS_PURE BufA(0.,0.).x
    #define GET_BASS BufA(0.,3.).x
    #define GET_BASS_CONT BufA(0.,2.).x
    #define GET_MID_PURE BufA(1.,0.).x
    #define GET_MID BufA(1.,3.).x
    #define GET_MID_CONT BufA(1.,2.).x
    #define GET_TREB_PURE BufA(2.,0.).x
    #define GET_TREB BufA(2.,3.).x
    #define GET_TREB_CONT BufA(2.,2.).x
    #define GET_SOUND_PURE (GET_BASS_PURE + GET_MID_PURE + GET_TREB_PURE)/3.
    #define GET_SOUND (GET_BASS + GET_MID + GET_TREB)/3.
    #define GET_SOUND_CONT (GET_BASS_CONT + GET_MID_CONT + GET_TREB_CONT)/1.5
    float bass;
    float mid;
    float treb;
    float sound;
    float bass_cont;
    float mid_cont;
    float treb_cont;
    float sound_cont;
///////////////////////////////////////////////

void main()
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    //vec2 uv = (fragCoord-0.5*iResolution.xy)/iResolution.y;
    //uv *= 1.4;
    
//    bass = GET_BASS;
//    mid = GET_MID;
//    treb = GET_TREB;
    sound = GET_SOUND;
//    bass_cont = GET_BASS_CONT;
//    mid_cont = GET_MID_CONT;
//    treb_cont = GET_TREB_CONT;
//    sound_cont = GET_SOUND_CONT;

    vec3 col = texture(iChannel2, uv).xyz;
  
    vec2 sunpos = vec2(0.5, 0.5);

    // a nice trick a guy called Martin made on Milkdrop to make the all scene shine
    vec3 shine = col; 
    float radi = 1.;
    int anz = 70;//70;
    for (int n=1; n <= anz; n++)
    { 
      vec2 newUV = (uv-sunpos)*radi+sunpos;
      shine += (0.8 + 250.*pow(sound,15.))/float(anz)*texture(iChannel2, newUV).xyz;
      radi -= 1./float(anz);
    }
    
    col = max(shine, col); // add shine

    //col += clamp(shine,0.,1.);

    fragColor = vec4(col,1.0);
}
