#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define iResolution resolution
#define iTime time
#define iChannel0 eyecandyShadertoy

// arrrrgh I hate this "golfing" obfuscation nonsense...
#define o fragColor
#define U (fragCoord * resolution)

#define BASS_SAMPLE_POS 0.05    // Lower = deeper bass (0.01-0.1)
#define BASS_MULTIPLIER 4.0     // How much brighter on bass hits (2.0-8.0)  
#define COLOR_SHIFT_AMOUNT 8.0  // How much color changes on bass (4.0-12.0)
#define BASS_THRESHOLD 0.1      // Minimum bass level to trigger (0.05-0.3)
#define ORB_BRIGHTNESS 0.5      // Base orb brightness (0.5-3.0)

void main()
{
    vec2 u = U; // bleah, Shadertoy nonsense

    float d,a,e,i,s,t = iTime;
    vec3  p = vec3(iResolution, 0);    
    
    // Get bass frequency from audio channel
    float bass = texture(iChannel0, vec2(BASS_SAMPLE_POS, 0.25)).g;
    bass = max(0.0, bass - BASS_THRESHOLD); // Remove noise floor
    float bassBoost = ORB_BRIGHTNESS * (1.0 + bass * BASS_MULTIPLIER); // Brightness multiplier
    
    // scale coords
    u = (u+u-p.xy)/p.y;
    
    // cinema bars
    //if (abs(u.y) > .8) { o = vec4(0); return; }
    
    // camera movement
    u += vec2(cos(t*.4)*.3, cos(t*.8)*.1);
    
    for(o*=i; i++<128.;
        
        // accumulate distance
        d += s = min(.01+.4*abs(s),e=max(.8*e, .01)),
        
        // purple, blue color with audio reactive color shift
        o += (1.+cos(.1*p.z*vec4(3,1,0,0) + bass*COLOR_SHIFT_AMOUNT)) * bassBoost/(s+e*2.))
        
        
        // noise loop start, march
        for (p = vec3(u*d,d+t), // p = ro + rd *d, p.z + t;
    
            // entity (orb)
            e = length(p - vec3(
                sin(sin(t*.2)+t*.4) * 2.,
                1.+sin(sin(t*.5)+t*.2) *2.,
                12.+t+cos(t*.3)*8.))-.1,
            
            // spin by t, twist by p.z
            p.xy *= mat2(cos(.1*t+p.z/16.+vec4(0,33,11,0))),
            
            // mirrored planes 4 units apart
            s = 4. - abs(p.y),
            
            // noise starts at .42 up to 16., grow by a+=a
            a = .42; a < 16.; a += a)
            
            // apply turbulence
            p += cos(.4*t+p.yzx)*.3,
            
            // apply noise
            s -= abs(dot(sin(.1*t+p * a ), .18+p-p)) / a;
    
    // tanh tonemap, brightness, light off-screen
    u += (u.yx*.9+.3-vec2(-1.,.5));
    o = tanh(o/6./max(dot(u,u), .001));
}
