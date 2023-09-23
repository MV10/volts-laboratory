#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define i (fragCoord * resolution)
#define o fragColor
#define iChannel0 inputB
#define iResolution resolution
#define iTime time
#define iFrame frame




#define timescale 10
#define speed 0.01

float line(vec2 u, vec2 s, vec2 e)
{
    //shift coords to 0,0
    vec2 l1 = u-s;
    vec2 e2 = e-s;
    //formula to find nearest projection of u on se
    vec2 l2 = e2*(( dot(l1,e2) /(dot(e2,e2))) );
    
    return 1.-smoothstep(0.001,0.003,length(l1-l2));
}

void main()
{
    vec2 uv = i/iResolution.xy;
    uv += 0.0001*sin(uv.x*80.0+iTime);

// MHH start-up content is the primary renderer
//    if(iTime < 1.)
//    {
//    	vec3 col = 0.5 + 0.5*cos(iTime+3.0*uv.xyx+vec3(0,2,4));
//    	o = vec4(col,1.0);
//    }
    if(iFrame == 0)
    {
        fragColor = vec4(texture(input0, fragCoord).rgb, 1.0);
    }
    else
    {
        o = texture(iChannel0, uv);
        vec2 start=vec2(0),end=vec2(0);
        float seed = float(iFrame/timescale);
        float s = sin(seed), c = cos(seed);
        //choose a pseudo-rando slice angle
        vec2 a = vec2(s,c);
        //pos (0-1)
        vec2 p = fract(vec2(s*325.253,c*9258.353));
        start = 0.25+.5*p;
        end = p + a;

        //if(iFrame % timescale == 0)
        if(mod(iFrame, timescale) == 0.0)
        {
            vec3 c = fract(vec3(s*83928.3523,c*9283.353,s*32985.33));
            o.xyz += c*line(uv, start, end);
        }
        else
        {
            //shift coords to 0,0
    		vec2 l1 = uv-start;
    		vec2 e2 = end-start;
    		//formula to find nearest projection of u on se
    		vec2 l2 = start + e2*(( dot(l1,e2) /(dot(e2,e2))) );
            if(uv.y < l2.y)
            {
	            uv += a*speed;
	            o = texture(iChannel0, uv);
	        }
        }
    }
    
    //o = vec4(1)*line(uv, vec2(0.5,0.5), vec2(1,1));
}