#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
uniform sampler2D inputA;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 eyecandyShadertoy
#define iChannel1 inputA

// mcguirev10 - MHH doesn't calculate this; hard-code a perfect 60FPS
#define iTimeDelta (1.0/60.0)

///////////////////////////////////////////////
// Same for each pass (and #define won't work from a library)
    //#define BufA(x, y) texture(iChannel1, (vec2(x, y) + 0.5) / iResolution.xy)
    #define BufA(x, y) texture(iChannel1, (vec2(x, y) + 0.1) / iResolution.xy)
    //#define BufA(x, y) texture(iChannel1, vec2(x, y) / iResolution.xy)

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

// bass bands
#define BASS_START 0
#define BASS_END 14
// middle bands
#define MID_START 15
#define MID_END 143
// treble bands
#define TREBLE_START 144
#define TREBLE_END 511

/*------------ Tuning ------------*/

/*---- Smooth Sound values ----*/
// lower value - less time for the smooth sound stay on top of the pure sound
#define DECREASE_MIN 0.001
// lower value - lower decrease time. should be above 1.
#define DECREASE_MUL 1.
/* lower value - slower increase of smooth sound. 
   higher value - faster increase.
   should be below 1. */
#define INCREASE_MUL 0.9

/*---- Smooth Sound Continues values ----*/
/* play with this to get smaller\bigger "acceleration" for the circles
   lower value - more deceleration
   should be below 1 */
#define DELTA_INCREASE 0.8

/* should be a value between 0 and 1
   play with this to get smaller\bigger "deceleration" for the circles
   lower value - less acceleration */
#define DELTA_MUL 0.95

/* bigger DELTA_COUNT_MAX value will take into account more of the "acceleration"
   lower value will restrain the acceleration
   in other words - saturate it */
#define DELTA_COUNT_MAX 8.

float getSound(int start, int end)
{
    float ret = 0.;
    for(int i = start; i <= end; i++)
    {
        float samp = texelFetch(iChannel0, ivec2(i, 0), 0).g;

        samp = samp * samp + 0.5 * samp;
        if(samp > 0.8) samp *= 0.8; // reduce magnitude of low frequencies
        ret += samp;
    }
    ret /= float(end - start + 1);
    return ret;
}

void main()
{
    //float fpsInv = 60./iFrameRate;
    fragColor = vec4(0.0,0.0,0.0,1.0);

    // mcguirev10 - the calculated MHH fragCoord isn't offset like Shadertoy
    //vec2 operation = fragCoord - 0.5;
    vec2 operation = floor(fragCoord);
    if(operation.x >= 3.0 || operation.y >= 7.0) return;

    int start, end;
    
    float sound = 0.; // pure sound samples average
    float prev_sound = 0.; // previous sound
    float smooth_sound = 0.; // smooth sound
    float prev_smooth_sound = 0.; // previous smooth sound
    float decrease = 0.;
    float smooth_sound_cont = 0.; // smooth sound continues
    float prev_smooth_sound_cont = 0.; // previous smooth sound continues
    float delta = 0.;
    float delta_count = 0.;

    // fragCoord.x determines to calculate bass\mid\treble
    if(operation.x == 0.) { start = BASS_START; end = BASS_END; }
    if(operation.x == 1.) { start = MID_START; end = MID_END; }
    if(operation.x == 2.) { start = TREBLE_START; end = TREBLE_END; }
    
    // prev sound
    sound = getSound(start, end);
    prev_sound = BufA(operation.x, 0.).x;
    
    // sound type 2
    prev_smooth_sound_cont = BufA(operation.x, 2.).x;
    prev_smooth_sound = BufA(operation.x, 3.).x;
    decrease = BufA(operation.x, 4.).x;
    if(sound > prev_smooth_sound)
    {
        smooth_sound = prev_smooth_sound + (sound-prev_smooth_sound)*INCREASE_MUL;
        decrease = DECREASE_MIN;
    }
    else
    {
        smooth_sound = prev_smooth_sound - decrease;
        decrease *= 1. + iTimeDelta * DECREASE_MUL;
    }
    
    // smooth_sound_cont - circles motion
    delta = BufA(operation.x, 5.).x;
    delta_count = BufA(operation.x, 6.).x;
    if(sound > prev_sound)
    {
        // this statement is to prevent exreme acceleration, when bass\middle\treble goes higher very quickly.
        // in other words - saturate it.
        // bigger value - accept a bigger acceleration.
        // to notice the difference, just comment the if statement and reset the shader,
        // then look at the blue circle which represent the treble
        if(delta_count < DELTA_COUNT_MAX)
        {
            //delta += DELTA_INCREASE;
            delta += iTimeDelta * DELTA_INCREASE;
            delta_count += 1.; // for each delta increase
        }
    }
    else
    {
        delta_count = 0.; // reset the counting
        delta *= DELTA_MUL;
    }
    smooth_sound_cont = smooth_sound * iTimeDelta + delta + prev_smooth_sound_cont; 
    
    // to prevent the value to go extremely high, can be useful in some cases when we only care about the fraction value
    if(smooth_sound_cont > 50.)
        smooth_sound_cont -= floor(smooth_sound_cont);
    
    // fragCoord.y determines to calculate sound\smoth_sound\etc..
    if(operation.y == 0.) fragColor = vec4(sound, 0.,0.,1.0);
    if(operation.y == 2.) fragColor = vec4(smooth_sound_cont, 0.,0.,1.0);
    if(operation.y == 3.) fragColor = vec4(smooth_sound, 0.,0.,1.0);
    if(operation.y == 4.) fragColor = vec4(decrease, 0.,0.,1.0);
    if(operation.y == 5.) fragColor = vec4(delta, 0.,0.,1.0);
    if(operation.y == 6.) fragColor = vec4(delta_count, 0.,0.,1.0);
}
