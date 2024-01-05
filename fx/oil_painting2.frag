#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input1;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input1

#define Res  resolution.xy
#define Res0 resolution.xy
#define Res1 vec2(textureSize(iChannel1,0))
#define Res2 vec2(textureSize(iChannel2,0))

vec4 getRand(vec2 pos) 
{
    vec2 uv=pos/Res1;
    return texture(iChannel1,uv);
}

float getVal(vec2 uv)
{
	float r = getRand(uv*iResolution.xy*.02).x*2.-1.;
	r=0.*exp(-abs(r)/0.05);
	
    return mix(1.,
    //length(textureLod(iChannel0,uv,1.7+.5*log2(iResolution.x/1920.)).xyz)
    length(textureLod(iChannel0,uv,2.5+.5*log2(iResolution.x/1920.)).xyz)*.6+
    length(textureLod(iChannel0,uv,1.5+.5*log2(iResolution.x/1920.)).xyz)*.3+
    length(textureLod(iChannel0,uv,.5+.5*log2(iResolution.x/1920.)).xyz)*.2
    ,1.-r);
}
    
vec2 getGrad(vec2 uv,float delta)
{
    vec2 d=vec2(delta,0);
    return vec2(
        getVal(uv+d.xy)-getVal(uv-d.xy),
        getVal(uv+d.yx)-getVal(uv-d.yx)
    )/delta;
}

void main()
{
	vec2 uv = fragCoord/Res;
    vec3 n = vec3(getGrad(uv,1.0/iResolution.y),150.0);
    //n *= n;
    n=normalize(n);
    fragColor=vec4(n,1);
    vec3 light = normalize(vec3(1,-1,.8));
    float diff=clamp(dot(n,light),0.,1.0);
    float spec=clamp(dot(reflect(light,n),vec3(0,0,-1)),0.0,1.0);
    spec=pow(spec,12.0)*.5;
    float sh=clamp(dot(reflect(light*vec3(-1,-1,1),n),vec3(0,0,-1)),0.0,1.0);
    sh=pow(sh,4.0)*.1;
    //spec=0.0;
	fragColor = texture(iChannel0,uv)*mix(diff,1.,.8)+spec*vec4(.85,1.,1.15,1.)-sh*vec4(.85,1.,1.15,1.);
	fragColor.w=1.;
    
    if(true)
    {
        vec2 scc=(fragCoord-.5*iResolution.xy)/iResolution.x;
        float vign = 1.3-2.5*dot(scc,scc);
        vign*=1.-.8*exp(-sin(fragCoord.x/iResolution.x*3.1416)*20.);
        vign*=1.-.8*exp(-sin(fragCoord.y/iResolution.y*3.1416)*10.);
        fragColor.xyz *= vign;
    }
}