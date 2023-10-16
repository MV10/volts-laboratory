#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
uniform sampler2D iChannel1;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 inputA
#define iChannel2 eyecandyShadertoy
#define iTime time

mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}

float box(vec2 uv, vec2 b){
    vec2 q = abs(uv)-b;
    return length(max(vec2(0.),q))+min(0.,max(q.x,q.y));
}

float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.74));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
}

#define spuv(pp) (pp * vec2(iResolution.y / iResolution.x, 1))+.5

void main()
{
  vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;

  vec2 ouv = uv;
  vec2 puv = uv;

  uv*=4.;

  uv*=rot(-.785*.5);
   uv.x+=iTime*.2;
    
 
  vec2 id = floor(uv);
     uv.y +=sign(sin(id.x*120.))*iTime*.1;
  id = floor(uv);
    float h = hash21(id);
    uv*=rot(.785*20.*h);
  uv= fract(uv)-.5;   
  for(float i=floor(h*100.)/3.;i>0.;i--){
      uv= fract(uv)-.25;
      uv*=rot(id.x*.1+id.y*.2+-.785*.5*i+iTime*.133);
       uv = uv.x <uv.y ? uv.yx:uv.xy;
    
    }
  float ffx = texture(iChannel2,fract(vec2(.05+h+abs(uv.x*.5)))).g*.5;
  float ffy = texture(iChannel2,fract(vec2(.05+h+abs(uv.y*.5)))).g*.5;
    ffx = sqrt(ffx)*.3;
    ffy=sqrt(ffy)*.3;
  float d = box(uv,vec2(.5-ffy,.5-ffx));
  d = smoothstep(fwidth(d),.00,abs(d)-.01-sqrt(h)*(.02+texture(iChannel2,vec2(fract(id.x*.1+id.y*.1))).g*.05));
  vec3 col = vec3(d);
    
    float tt= texture(iChannel1,fract(uv)).r*.045;
    
    if(h<.5) puv = uv+puv;
      
    vec2 rpuv = spuv(puv*(.995+tt));    
    vec4 rpcol = texture(iChannel0,rpuv);
    
    vec2 gpuv = spuv(puv*(1.003-tt));    
    vec4 gpcol = texture(iChannel0,gpuv);
    
    vec2 bpuv = spuv(puv*(1.004-tt));    
    vec4 bpcol = texture(iChannel0,bpuv);
    
    col =mix(col,vec3(rpcol.r,bpcol.b,gpcol.g),max(.3,log(h+1.7)-texture(iChannel2,vec2(fract(.7+h))).g));

    fragColor = vec4(col,1.0);
}