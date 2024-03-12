#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

void main()
{
    vec2 p = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
    float t = 0.6;
    p = vec2(cos(t) * p.x - sin(t) * p.y, sin(t) * p.x + cos(t) * p.y);
    vec3 col = vec3(0.0);
    for(float i = 1; i < 100.0; i++)
    {
    	p.x += 0.7 / i * sin(i * 0.2 + p.y + iTime * 0.2);
    	p.y += 0.5 / i * cos(i * 4.0 * p.x + iTime * -0.6);
    }
   	float r = (cos(p.x + p.y + 1.0)) * 0.5 + 0.5;
	float g = abs(sin(p.x + p.y + 1.0));
	float b = 0.5 + 0.5 * ((sin(p.x + p.y) + cos(p.x + p.y)) * 0.8);
	col = vec3(r,g,b);
    //col *=col ;
    fragColor = vec4(col, 1.0);
}
