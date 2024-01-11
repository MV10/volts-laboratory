#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 inputB

vec4 getTexture(sampler2D sam, vec2 g, vec2 p, vec2 s)
{
	vec2 gp = g+p;
	
	if (gp.x >= s.x) gp.x = gp.x - s.x;
	if (gp.y >= s.y) gp.y = gp.y - s.y;
	if (gp.x < 0.0) gp.x = s.x + gp.x;
	if (gp.y < 0.0) gp.y = s.y + gp.y;
	
	return texture(sam, gp / s);
}

vec4 getState(sampler2D sam, vec2 g, vec2 s, float n)
{
	vec4 p = vec4(0);
	for (float i=0.;i<n;i++)
	{
        p = getTexture(sam, g, -p.xy, s);
	}
	return p;
}

#define tex(p) getTexture(iChannel0, g, p, s)
#define emit(v,k) if (length(g-(s * (0.5 + v))) < 5.) f.x = k, f.w = 1.

// mcguirev10 - so stupid...
#define f fragColor
#define g fragCoord

void main()
{
	vec2 s = iResolution.xy;
	
	vec4 r = tex(vec2(1,0));
    vec4 t = tex(vec2(0,1));
    vec4 l = tex(vec2(-1,0));
    vec4 b = tex(vec2(0,-1));
        
    vec2 v = g/s;
    
    // pifometre :)
    vec2 c = sin(v * 6.28318)*.5+.5;
    float cc = c.x + c.y;
    
	f = getState(iChannel0, g, s, cc * 2. + 1.);
    
    f.xy += vec2(r.z - l.z, t.z - b.z);
    
	vec4 dp = (r + t + l + b)/4.;			
	float div = ((l-r).x + (b-t).y)/20.;	
	
    f.z = dp.z - div;					
    
    emit(vec2(-0.45,0.),50.0);
    emit(vec2(0.45,0.),-50.0);
    
    
	if (frame < 2.) f *= 0.;
}
