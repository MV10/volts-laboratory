#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

// mcguirev10 - assume a perfect 60FPS
#define iTimeDelta float(1.0 / 60.0)

// Audio History Buffer

#define iChannelAudio eyecandyShadertoy
#define iChannelAudioHistory inputA  
    
vec4 SampleAudioRaw( float f, float t )
{   
    vec4 r = vec4( 0.0 );
    if ( t <= 0.0 )
    {
        //f = f * f;
        /*
        if ( f > 0.0 )
        {
			f = sqrt( f );
        }*/
        
        r = textureLod( iChannelAudio, vec2(f, 0.0), 0.0);
        
        float a = r.g;
        
        float shade = a * (0.75 + f * 0.25);

        shade = pow( shade, 10.0 ) * 50.0;

        r.r = shade;        
        r.g = f * 30.0 + iTime * 5.0;
        r.a = a * a;               
    }
    else
    {
    	r = textureLod( iChannelAudioHistory, vec2(f, t), 0.0);
    }
    
    return r;
}

vec4 SampleAudio( float f, float t, float dt )
{
    vec4 sp = SampleAudioRaw( f, t );

    float gradSampleDist = 0.01;
    
    float xofs = SampleAudioRaw( f - gradSampleDist, t ).a - SampleAudioRaw( f + gradSampleDist, t ).a;
    
    vec2 d = vec2( xofs * 5.0, -1.0 ) * dt;
    
    float speed = sp.a * 5.0 * (3.0 * f + 1.4);
    d = normalize(d) * dt * speed;
    f += d.x;
    t += d.y;
    
    t -= dt * 0.1;
    
    //t += -dt * (0.2 + f * f * f * 2.0);
    
    vec4 result = SampleAudioRaw( f, t );
    
    
    float fSpread = 0.005; //* (1.0 - sp.a* sp.a);
    result *= 0.8;
    result += SampleAudioRaw( f - fSpread, t ) * 0.1;
    result += SampleAudioRaw( f + fSpread, t ) * 0.1;
    
    return result;
}

void main()
{   
    ivec2 vTexelCoord = ivec2(fragCoord);
    float t = fragCoord.y / iResolution.y;
    fragColor = SampleAudio( fragCoord.x / iResolution.x, t, iTimeDelta);
}
