#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 input0
#define iChannel1 inputB
int iFrame = int(frame);

//-----------------USEFUL-----------------

#define PI 3.14159265359
#define E 2.7182818284
#define GR 1.61803398875

float saw(float x)
{
    x/= PI;
    float f = mod(floor(abs(x)), 2.0);
    float m = mod(abs(x), 1.0);
    return f*(1.0-m)+(1.0-f)*m;
}
vec2 saw(vec2 x)
{
    return vec2(saw(x.x), saw(x.y));
}

vec3 saw(vec3 x)
{
    return vec3(saw(x.x), saw(x.y), saw(x.z));
}
vec4 saw(vec4 x)
{
    return vec4(saw(x.x), saw(x.y), saw(x.z), saw(x.w));
}

#define R 3.0
#define RESTITUTION .5

vec4 FindArrivingParticle( vec2 arriveCoord )
{
    vec4 p = vec4(0.0);
    float sum = 0.0;
    for( float i = -R; i <= R; i++ )
    {
        for( float j = -R; j <= R; j++ )
        {
            vec2 partCoord = arriveCoord + vec2( i, j )/ iResolution.xy;
            
            vec4 part = texture( iChannel1, partCoord );
            
            
            vec2 nextPos = part.xy + .5*(part.zw*2.0-1.0)/ iResolution.xy * R* R;
            // arrival means within half a pixel of this bucket
            vec2 off = (nextPos - arriveCoord)*iResolution.xy;
            if( abs(off.x)<= sqrt(1.0)/2.0*GR && abs(off.y)<=sqrt(1.0)/2.0*GR )
            {
                // yes! greedily take this particle.
                // a better algorithm might be to inspect all particles that arrive here
                // and pick the one with the highest velocity.
                p += part;
                sum += 1.0;
            }
        }
    }
    // no particle arriving at this bucket.
    return p/sum;
}


void main()
{
    vec2 uv = fragCoord/iResolution.xy;
    vec2 uv0 = uv;
    vec4 sample0 = texture(iChannel1, uv0);
    vec4 sample1 = texture(iChannel0, uv0);
    vec4 arrival = FindArrivingParticle(uv);
    
    if(iFrame == 0)
    {
        fragColor = vec4(vec2(uv), vec2(0.5, 0.5));
        return;
    }
    
    float thresh = (64.0+32.0)/255.0;
    
    float w = clamp(length(sample1.rgb)/sqrt(3.0)*sample1.a, 0.0, 1.0);
    
    if(w > thresh || length(sample0.xy-uv) > sqrt(100.0)/length(iResolution.xy))
    {
        w = (w - thresh)/(1.0-thresh);
        fragColor = vec4(uv0, (saw(sample1.xy/w)));
        return;
    }
    
    w = (thresh-w)/(thresh);
    arrival.xy += .5*(arrival.zw*2.0-1.0)/ iResolution.xy * R * R;
    //arrival.zw = ((arrival.zw*2.0-1.0)*.975)*.5+.5;
    
    fragColor.xyzw = (arrival.xyzw);
}
