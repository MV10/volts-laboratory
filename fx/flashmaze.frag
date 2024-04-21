#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D iChannel0;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel1 input0
#define randomization (0.5 - randomrun)

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

float PI = 3.14159;
float TAU = 2.*3.14159;
// How time affect the distortion
#define TIME_MULTIPLIER 0.1
// How much strength of the distortion
#define DISTORTION_STRENGTH 0.025

lowp vec2 generateDistortion(sampler2D noise, in vec2 uv)
{
    return texture(iChannel0, uv).rr * DISTORTION_STRENGTH;
}

// Simplified line function, thanks FN!
float lineSeg( in vec2 p, in vec2 a, in vec2 b )
{
    b -= a; p -= a;
    return length(p*sin(iTime) - b* clamp( dot(p,b)/dot(b,b), 0., 1.) );
}

// Depending on ct and r, draw the appropriate lines
float drawCell(vec2 p, float ct, float r){
  if (ct == 1.){
    p *= rotation(r);
    float line1 = lineSeg(p, vec2(-1.,.5*sin(iTime)), vec2(-.5,1.));
    float line2 = lineSeg(p, vec2(-1.,-.5), vec2(.5,1.));
    float line3 = lineSeg(p, vec2(-.5*sin(iTime), -1.), vec2(1.,.5));
    float line4 = lineSeg(p, vec2(.5*cos(iTime),-1.), vec2(1.*cos(iTime),-.5));
    return min(min(min(line1,line2),line3),line4);
  }


  if (ct == 3.){  
    p *= rotation(r);
    float line1 = lineSeg(p, vec2(-.5,1.*sin(iTime)), vec2(.5,1.));
    float line2 = lineSeg(p, vec2(.5,-1.), vec2(-.5,-1.*sin(iTime)));
    float line3 = lineSeg(p, vec2(-1.*sin(iTime),.5), vec2(-1.,-.5*sin(iTime)));
    float line4 = lineSeg(p, vec2(1.*cos(iTime),.5), vec2(1.,-.5));
    return min(min(min(line1,line2),line3),line4);
  }

  if (ct == 2.){
    p *= rotation(r);
    float line1 = lineSeg(p, vec2(-1.*cos(iTime),.5), vec2(-.5*sin(iTime),.5));  
    float line2 = lineSeg(p, vec2(-.5,.5), vec2(-.5,1.*sin(iTime)));  
    float line3 = lineSeg(p, vec2(1.*cos(iTime),.5), vec2(.5,.5));
    float line4 = lineSeg(p, vec2(.5,.5), vec2(.5,1.));
    float line5 = lineSeg(p, vec2(-1.,-.5), vec2(-.5,-.5));
    float line6 = lineSeg(p, vec2(-.5,-.5*cos(iTime)), vec2(-.5*sin(iTime),-1));  
    float line7 = lineSeg(p, vec2(.5,-1.*cos(iTime)), vec2(.5,-.5));
    float line8 = lineSeg(p, vec2(.5,-.5*sin(iTime)), vec2(1.*sin(iTime),-.5)); 
    
    // There's got to be a better way to do this, right?
    return min(min(min(min(min(min(min(line1, line2),line3),line4),line5),line6),line7),line8);
  }
}

float rando1(vec2 cid){
  return fract(342.5*sin(25.+32.322*cid.x)+50.34*sin(5.+81.498*cid.y));
}

float rando2(vec2 cid){
  return fract(23.3*sin(2.+1.3*cid.x)+15.34+sin(32.+7.243*cid.y));
}

mat2 rotationMatrix(float angle)
{
    return rotation(angle * PI);
}

void main()
{
   vec2 uv = ( fragCoord - .5* iResolution.xy ) /iResolution.y;

   // mcguirev10 - mo betta
   uv *= rotationMatrix(time * 0.03 * randomization);

   vec3 col = vec3(0.);
   
   float tt = fract(.5*iTime);
   
   // Maintain the original uv coordinate for line thickness dynamics
   vec2 uv_0 = uv;
  

    vec2 distortion = generateDistortion(iChannel0, uv);
    vec2 distortedUv = uv + distortion + iTime * TIME_MULTIPLIER;
    
    vec4 color = texture(iChannel1, fragCoord / iResolution.xy);
   // Scale the uv coordinates
   float scale = 10.;
   uv *= scale;
   
   // Generate cell IDs
   vec2 cellID = floor(uv);
   
   // Shift the coordinates in each cell, -1 to 1 in each direction
   uv = fract(uv) * 2. - 1.;

   // Line thicknes dynamics
   float thick = 0.11 + .05*cos(TAU*(tt - 1.*length(uv_0 - vec2(-5.,1.))));
   
   // Neighbor checking
   float minCell = 1.;
   for(float i = -1.; i <= 1.; i++)
   for(float j = -1.; j <= 1.; j++){
     float cellType = 1. + floor(3. * rando1(cellID + vec2(i,j)));
     float rType = (PI/2.) * floor(4.* rando2(cellID + vec2(i,j)));
     
     float cellVal = drawCell(uv - 2.*vec2(i,j),cellType,rType);
     minCell = min(minCell, cellVal);
   }
   
   // Color the coordinate
   col += thick/pow(minCell,0.75)*color.xyz;
 
   fragColor = vec4(col*color.xyz,1.0);
}