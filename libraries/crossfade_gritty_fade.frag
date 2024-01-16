#version 460
precision highp float;

// Adapted from https://www.shadertoy.com/view/ftVBDd

in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

uniform float fadeLevel;
#define uv fragCoord

// sigh...
float nrand( vec2 n )
{
	return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

float n1rand( vec2 n )
{
	float nrnd0 = nrand( n );
	return nrnd0;
}

void main()
{
    //float alpha = (mod(iTime,4.0))/3.0;
    //alpha = clamp(alpha,0.0,1.0);
    
    float alpha = fadeLevel;
    
    float omalpha = 1.0 - alpha;

    float beta = (3.14 * n1rand(uv));

    vec2 uv1, uv2;
    
    float scale = 0.1;
    
    uv1.x = uv.x + scale * omalpha * (sin(beta));
    uv1.y = uv.y + scale * omalpha * (cos(beta));

    uv2.x = uv.x + scale * alpha * (sin(beta));
    uv2.y = uv.y + scale * alpha * (cos(beta));
    
    fragColor = (1.0-alpha) * texture(oldBuffer, uv2) + alpha * texture(newBuffer, uv1);
}
