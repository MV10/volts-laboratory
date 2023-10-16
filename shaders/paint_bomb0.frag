#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform float time;
uniform sampler2D inputA;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iFrame frame
#define iTime time
#define iChannel1 inputA
float iTimeDelta = 1. / 60.; // fake perfect 60 FPS


vec2 noise(vec2 id){
    float r = fract(sin(id.y*21422.125)*31455.31531);
    float rb = fract(sin(id.x*21422.125)*31455.31531);
    return vec2(r, rb);
}

vec3 get( vec2 fc )
{
    vec2 uv = fc/iResolution.xy;

    vec3 col = vec3(0);

    #define pal(a,b,c,d,e) ((a) + (b)*sin((c)*(d) + (e)))
    
    vec2 id = floor(uv*1000.);
    
    //vec2 n = noise(vec2(id.x + iTime*0.00001,id.y - iTime*0.000000));
    vec2 n = noise(vec2(id.x + iTime*0.00001,id.y - iTime*0.000000));
    
    //col += pal(-0., 3., vec3(0.8,8.9,4.3), 1. + id.x *20. + n.y*2000.,0.9 + id.y*20.4 + n.x*20. + iTime);
    //col += pal(-0., 3., vec3(0.8,8.9,4.3), 1. + sin(id.x *20.) + sin(n.y*2000.),0.9 + id.y*20.4 + n.x*20. + iTime);
    col += pal(-0., 5., vec3(4.8,2.9,9.3), 4. + sin(id.x *20.) + sin(n.y*2000.),0.9 + id.y*20.4 + n.x*20. + iTime);
    
    
    //col = smoothstep(0.,1.,col);
    
    
    return col;
}

void main()
{

    vec2 uv = (fragCoord - 0.5*iResolution.xy)/iResolution.y;
 
    vec2 cuv = fragCoord/iResolution.xy;   
    
    vec3 col = vec3(0);
    
    vec3 g = get(fragCoord);
  
    vec2 nc = fragCoord/iResolution.xy - 0.*(0. + length(uv)*2.)*normalize(uv)/iResolution.xy*iTimeDelta;
	    
	vec2 st = 30./iResolution.xy;
    
    vec2 lc = nc;
    vec4 u = texture(iChannel1, lc + vec2(0,st.y) );
    vec4 d = texture(iChannel1, lc + vec2(0,-st.y) );
    vec4 l = texture(iChannel1, lc + vec2(-st.x,0) );
    vec4 r = texture(iChannel1, lc + vec2(st.x,0) );
    
    vec2 grb = (vec2( r.b - l.b, u.b - d.b));
    vec2 gr = normalize(vec2( r.r - l.r, u.r - d.r));
    #define rot(x) mat2(cos(x),-sin(x),sin(x),cos(x))
    
    gr *= rot(3.14/4.);
    grb *= rot(3.14/8./8.);
    //ddb *= rot(3.14/2. - 3. - sin(iTime)*0.5 - 0.1);
    
    nc += grb*st*2.9;
    //nc += grb*st*2.9*iTimeDelta*100.;
    //nc -= gr*st*0.;
    
    if(iFrame > 0)
    	col = mix(g, texture(iChannel1,nc).xyz, 0.999);
    if(iFrame == 0)
        col = vec3(0);

    fragColor = vec4(col,1.0);
}