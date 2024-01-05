#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

#define Res  resolution.xy
#define Res0 resolution.xy
#define Res1 vec2(textureSize(iChannel1,0))
#define Res2 vec2(textureSize(iChannel2,0))

#define PI2 6.28318531

vec4 getCol(vec2 pos, float level)
{
    // preserve aspect ratio of original vid
	vec2 uv = (pos-Res*.5)*min(Res0.x/Res.x,Res0.y/Res.y)/Res0+.5;
    
    vec4 c1 = textureLod(iChannel0,uv,level);
    return c1;

    /*
    // green screen and bg
    uv = uv*vec2(-1,-1)*2.7+0.015*vec2(sin(iTime*1.1),sin(iTime*0.271));
    // had to use .xxxw because tex on channel2 seems to be a GL_RED-only tex now (was probably GL_LUMINANCE-only before)
    vec4 c2 = vec4( vec3(0.5,0.7,1.0)*.5*(.3*textureLod(iChannel2,uv,level).xyz+.7*textureLod(iChannel2,uv*.33,level).xyz), 1 );
    float d=clamp(dot(c1.xyz,vec3(-0.5,1.0,-0.5)),0.0,1.0);
    return mix(c1,c2,1.8*d);
    return c1;
    */
}

float getVal(vec2 pos, float level)
{
    return length(getCol(pos,level).xyz)+0.0002*length(pos-0.5*Res);
}
    
vec2 getGrad(vec2 pos,float delta)
{
    float l = log2(delta*Res0.x/Res.x);
    vec2 d=vec2(delta,0);
    return vec2(
        getVal(pos+d.xy,l)-getVal(pos-d.xy,l),
        getVal(pos+d.yx,l)-getVal(pos-d.yx,l)
    )/delta;
}

vec4 getRand(vec2 pos) 
{
    vec2 uv=pos/Res1;
    return texture(iChannel1,uv);
}

vec4 getRandBlueS(vec2 pos) 
{
    vec2 uv=pos/Res1;
    return texture(iChannel1,uv)-texture(iChannel1,uv+.5);
}

vec4 getRandBlue(vec2 pos) 
{
    vec2 uv=pos/Res1;
    vec4 c = clamp((texture(iChannel1,uv)-texture(iChannel1,uv+.5))*1.2+.5,0.,1.);
    //return c;
    return mix(c.xxxx,c,.3);
}

vec4 getPatt(vec2 pos) 
{
    vec2 uv=pos/Res1;
    vec4 s = sin(.23*pos.xyxy*PI2-vec4(0,0,PI2/4.,PI2/4.))*.5+.5;
    return vec4(
        dot(s.xy,vec2(.5)),
        dot(s.zw,vec2(.5)),
        dot(s.yz,vec2(.5)),
        dot(s.wx,vec2(.5))
        )
    ;
}

vec4 getColDist(vec2 pos)
{
	//return smoothstep(0.5,1.5,getCol(pos,0.)+getRand(pos).xxxx);
	return 1.-smoothstep(0.5,1.5,(1.-getCol(pos,0.))+pow(getRandBlue(pos),vec4(.75))*.75);
	//return smoothstep(0.5,1.5,getCol(pos,0.)+mix(getPatt(pos),getRandBlue(pos),.75));
}

#define SampNum 24

void main()
{
    vec2 pos0 = fragCoord;
    vec2 pos = pos0;
    vec3 col=vec3(0);
    float cnt=0.0;
    float fact=1.0;
    for(int i=0;i<SampNum;i++)
    {
        col+=fact*getColDist(pos).xyz;
        vec2 gr=vec2(0);
        gr+=getGrad(pos,8.0*iResolution.x/600.);
        gr+=getGrad(pos,4.0*iResolution.x/600.);
        gr+=getGrad(pos,2.0*iResolution.x/600.);
        //gr+=getGrad(pos,1.0*iResolution.x/600.);
        	
        vec2 d = gr.yx*vec2(1,-1);
        
        pos+=.5*iResolution.x/600.*normalize(d);
        //fact/=1.1;
        cnt+=fact;
    }
    col/=cnt;
	fragColor = vec4(col,1.0);
	//fragColor.xyz = getPatt(pos0).xyz;
	//float r = getRand(pos0*.07).x*2.-1.;
	//r=exp(-r*r/0.03);
	//fragColor.xyz = vec3(0)+r;
}