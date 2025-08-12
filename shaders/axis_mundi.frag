#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
uniform sampler2D noisetexture;
out vec4 fragColor;

#define iResolution resolution
#define iTime time
#define iChannel0 inputA
#define iChannel1 eyecandyShadertoy

// grr ... so stupid
#define o fragColor
#define u (fragCoord * resolution)

#define TIME time
#define RESOLUTION resolution

#define SURREAL_USE_FFT 0
#define SURREAL_FALL 0.1
#define SURREAL_SPACING 1
#define SURREAL_COLS 128
#define SURREAL_ROWS 50

#define PI 3.14159265

#define Rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))

// speed
#define tt (iTime * .6) 

// PI value
#define PI 3.14159265

// random
//#define H(P) fract(sin(dot(P,vec2(127.1,311.7)))*43758.545)
// mcguirev10 - This doesn't work right on my AMD Radeon 780M
// so we replace it with a noise texture lookup that seems to
// pretty accurately reproduce what I see on my NVIDIA GPU.
#define H(P) texture(noisetexture, sin(P)).r

// rotate 
#define pR(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define FUNC(x,y) (texture(iChannel1, vec2(x,y)).g-0.5)

#define ID 0.12321
#define  MAX_STARS 6

uniform float exposure;
uniform vec3 color;
uniform float speed;
uniform float seed;

const int num = 10;
const float ITERATIONS = 3.;
const float TARGET_EXP = 0.1;
const vec3 COLOR = vec3(0.7,0.4,0.1);

float squared(float value) 
{ 
    return value * value; 
}

vec2 rotz(in vec2 p, float ang) 
{ 
    return vec2(p.x*cos(ang)-p.y*sin(ang),p.x*sin(ang)+p.y*cos(ang)); 
}

float pointLight(vec2 pos, vec2 uv, float ra, float spa ,float r)
{
	float color = 0.;
	float d = radians(mod(-spa,90.));
	float a = radians(mod(ra,360.));
	
	mat2 rot = mat2(
		sin(a),cos(a),
		-cos(a),sin(a)
	);
	
	vec2 pj = uv*rot;
	
	vec2 ppj = pos*rot;
	
	color += clamp((-d+asin(((pj.x-ppj.x)/distance(pj,ppj)))) / (PI/2.),0.,1.) ;
	color *= clamp(1.-distance(pj/r,ppj/r),0.,1.);
	
	return color;
}

vec3 hsv2rgb(vec3 c) 
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 hueShift(vec3 col, float shift) 
{
    vec3 m = vec3(cos(shift), -sin(shift) * .57735, 0);
    m = vec3(m.xy, -m.y) + (1. - m.x) * .33333;
    return mat3(m, m.zxy, m.yzx) * col;
}

float happy_star(vec2 uv, float anim)
{
    uv = abs(uv);
    vec2 pos = min(uv.xy/uv.yx, anim);
    float p = (2.0 - pos.x - pos.y);
    return (2.0+p*(p*p-1.5)) / (uv.x+uv.y);      
}

void main() 
{
    float kval[MAX_STARS];
    vec4 oo=vec4(0);
    vec2 uvTrue = u.xy / iResolution.xy;
    float i = 0.0;
   
    o *= 0.0;
    
    // Calculate fade status OUTSIDE the loop
    float timePhase = pow(sin(time * 0.4) * 0.5 + 0.5, 0.3);
    float fadeFactor = smoothstep(0.3, 0.8, timePhase) * (1. - smoothstep(0.7, 1., timePhase));
    bool fadeEnded = fadeFactor < 0.01;

    float lastUpdate = texture(iChannel0, vec2(8./iResolution.x,0.)).a * 100.0;
    float timeSinceUpdate = mod(iTime, 100.0) - lastUpdate;
    if (timeSinceUpdate < 0.0) timeSinceUpdate += 100.0;

    bool basicWriteK = (floor(iTime * 60.0) == floor(mod(floor(iTime * 60.0), 240.0))) && (mod(floor(iTime * 60.0), 240.0) == 0.0);
    bool forceUpdate = timeSinceUpdate > 20.0; // Force update after 20 seconds max

    bool writeK = basicWriteK && (fadeEnded || forceUpdate);

    // Store update timestamp
    if (writeK && u.x == 8. && u.y == 0.) {
        o.a = mod(iTime, 100.0) / 100.0;
    }
    float kval_range = 100./float(MAX_STARS);
    float timeStamp = floor(iTime / 4.0);

    float k1=-1., k2=-1.;
    float _id = texture(iChannel0, vec2(0)).a;
    if (_id == ID) {
        for (int i=0; i<MAX_STARS; i++) {
        kval[i] = texture(iChannel0, vec2(float(i+1)/iResolution.x,0.)).a; // +1 offset
    }
    } else {
          // Random mod(floor(iTimenumber of active stars (1-4)
        int numActiveStars = int(1.0 + fract(sin(timeStamp * 45.123) * 43758.5453) * float(MAX_STARS));

        // Generate kval array
        for (int i=0; i<MAX_STARS; i++) {
            if (i < numActiveStars) {
                // Active star - generate random k value
                kval[i] = fract(sin(timeStamp * (12.9898 + float(i+1) * 78.233)) * 43758.5453) * 50.0;
            } else {
                // Inactive star - mark with 0.0
                kval[i] = 0.0;
            }
        }

    }

     vec2 uvv = ( u.xy - 0.5 * resolution.xy ) / resolution.y;
    vec2 uv2 = ( gl_FragCoord.xy / resolution.xy );
      uv2.x*=resolution.x/resolution.y;
    uvv.y -= 0.1;
    uv2=uvv*10.-0.;


    vec2 light = vec2(-1,0);
    mat2 rot = mat2(
        sin(time*sin(length(uvv*PI))),cos(time*sin(length(uvv*PI))),
        -cos(time*sin(length(uvv*PI))),sin(time*sin(length(uvv*PI)))
    );

    vec3 color = vec3(.0);

    float d = PI/6.;
    vec2 p = 1.0*( gl_FragCoord.xy / resolution.xy )-1.0; 
    p.x *= resolution.x/resolution.y; 	
    vec3 col3 = vec3(-2.4); 
    float t = iTime * .1 + ((.25 + .05 * sin(iTime * .1))/(length(p.xy) + .07)) * 2.2;
    float si = sin(t);
    float co = cos(t);
    mat2 ma = mat2(co, si, -si, co);

    p.y = abs(p.y);

    p = rotz(p, time*0.35+atan(p.y,p.x)*6.28);
    p *= 0.1+sin(time*0.5); 

    vec2 uv5 = gl_FragCoord.xy / resolution.xy;
    uv5 -= 0.5;
    uv5 /= vec2(resolution.y / resolution.x, 1.0);
    uv5.y += 0.1;

    float angle = atan(uv5.y, uv5.x) + time * 0.5;
    float radius = length(uv5);
    float swirl = sin(radius * 10.0 - time * 3.0) * 0.5 + 0.5;

    float hue = fract(angle / (2.0 * 3.141592) + swirl);
    float saturation = 1.0 - radius;
    float value = swirl;

    vec3 color3 = hsv2rgb(vec3(hue, .5 * saturation, value*.75));

   vec4 terrainColor=vec4(0);
   vec4 terrain = vec4(0); // Separate terrain accumulator
    float transmittance = 1.; // How much light gets through

    vec2 curve = vec2(
        sin(iTime *.3) * 0.001,                    
        sin(iTime) * 0.001       
    );
    bool hitTerrain = false;
    float maxTerrainDistance = 0.0;

    float ii=0.,dd=0.0,s=0.0,ff=0.0;
    for(oo*=ii; ii++<50.; ) {
        vec3 p = dd * normalize(vec3(u+u,0) - iResolution.xyx );
        p.xy += dd * dd * curve;
    
       if (dd > 50.0) break; // Stop terrain beyond distance 30
    
        for (s = .1; s < 1.;
            p.z += iTime+ii,
            p.y += .3  - (ff=FUNC(max(p.x*.05+0.5,0.),p.z*0.01)),
            //p.xy -= dot(cos(p * s * 16.), vec3(.01)) / s,
            s += s);
    
        dd += s = .05 + max(abs(p.x)-3.0, abs(p.y));
    
   
        float elevation = min(ff*ff,p.z);
        maxTerrainDistance = max(maxTerrainDistance, dd);
        float elevationFactor = smoothstep(-1.5, 3.0, elevation);
        vec4 terrainColor = (1.+cos(elevation+elevationFactor*(dd)+vec4(4,2,1,0))) / s;
        terrainColor.rgb *= (0.2 + 0.8 * elevationFactor);
    
        float alphaFade = exp(-dd * 0.08);
        terrainColor.a *= alphaFade;
     
       // if (alphaFade > 0.01) {
        oo += terrainColor / 50.;
  
            // Remove the second alphaFade here!
       // }

    }
    
   vec2 uv = (u - .5 * iResolution.xy - .5) / iResolution.y;
    uv *= 2.; //z FOV

    // camera
    vec3 
        vuv = vec3(2.*sin(iTime * .3), 1., sin(iTime)), // up
        ro = vec3(0., 0., 134.), // pos
        vrp = vec3(5., sin(iTime) * 60., 20.); // look at

    vrp.xz * pR(iTime);
    vrp.yz * pR(iTime * .2);

    vec3
        vpn = normalize(vrp - ro),
        uu = normalize(cross(vuv, vpn)),
        rd = normalize(
            vpn + uv.x * uu  + uv.y * cross(vpn, uu)
        ); // ray direction

    vec3 sceneColor = vec3(0.0, 0., 0.3); // background color

    vec3 flareCol = vec3(0.); // flare color accumulator   
    vec3 flareIntensivity = vec3(0); // flare intensity accumulator
    float tc = floor(time+1.);

     // uvv *= 1.5;
    vec3 kol = vec3(0), col = vec3(0);
     vec2 uv3 = uv2*.3;

      float iter = 100./ITERATIONS;
       ii = 1.;
      
        float b=0.;
        vec2 uvv2 = uvv;
        
        col = vec3(0);
            
         uv3 = uv2 *.35;
         flareIntensivity = vec3(0);
        for (float k = 0.; k < 100.; k++) 
        {
           float r = H(vec2(k)) * 2. - 1.; // random
            vec3 flarePos =  vec3(
                H(vec2(k) * r) * 20. - 10.,
                r * 10.,
                (mod(sin(k / 100. * PI * 4.) * 15. - tt * 13. * k * .007, 10.))
            );
            
       flarePos = normalize(flarePos);

        float v = abs(dot(flarePos, rd)); 
       

        flareIntensivity += pow(v, 30000.) * 2.;
        flareIntensivity += pow(v, 1e3) * .2; 
        flareIntensivity *= 1.- flarePos.z / 2.; 


      bool showStar = false;
    float bestZ = 10.0; // Start with max z
    int bestStar = -1;

    for (int i = 0; i < MAX_STARS; i++) {
        if (kval[i] > 0.0 && k >= kval[i] && k < kval[i] + 1.0) {
            float starZ = mod(sin(kval[i] / 100. * PI * 4.) * 15. - tt * 13. * kval[i] * .007, 10.);
        
            if (starZ < bestZ) { // Lower z = longer life
                bestZ = starZ;
                bestStar = i;
                showStar = true;
            }
        }
    }

    if (showStar) {
    float starX = dot(flarePos, uu);
    float timePhase = pow(sin(time * 0.4) * 0.5 + 0.5, 0.3);
    float fadeFactor = smoothstep(0.3, 0.8, timePhase) * (1. - smoothstep(0.7, 1., timePhase));
    fadeEnded = fadeFactor < 0.01;

    float starY = dot(flarePos, cross(vpn, uu));
    vec2 originalUV = (u - .5 * iResolution.xy) / iResolution.y;
    float closeness = 1.0 - flarePos.z;
    float starScale = 4.0 + closeness * 12.0;
    vec2 starUV = (originalUV - vec2(starX, starY) / 2.4) * starScale;

    float starShape = happy_star(starUV, 1.0 + 0.5 * sin(time*.3));
    vec3 starCol = starShape * hsv2rgb(vec3(mod(time * 0.1, 1.), 0.8, 1.0));
    starCol = min(.2 * starCol, 6.); 
    flareIntensivity += starCol * fadeFactor;
    }

        flareCol +=  flareIntensivity * (vec3(sin(r * 3.12 - k), r, cos(k) * 2.)) * .5;
     }

    sceneColor += abs(flareCol);

    // go grayscale from screen center
    sceneColor = mix(sceneColor, sceneColor.rrr * 1.4, length(uv) / 2.);
    sceneColor = pow(sceneColor, vec3(1.));
    // adjust contrast
    dd = (dd <= 0.) ? 0.: 1.0;
    o.rgb = tanh((sceneColor+color3*color3*.5)*(1.-o.a)*dd+oo.rgb);
    o*=o;



    if (writeK && _id != ID) {
        float timeStamp = floor(iTime / 4.0);
    
        // Random number of active stars (1-4)
        int numActiveStars = int(1.0 + fract(sin(timeStamp * 45.123) * 43758.5453) * float(MAX_STARS));
    
        // Generate kval array
        for (int i=0; i<MAX_STARS; i++) {
            if (i < numActiveStars) {
                // Active star - generate random k value
                kval[i] = fract(sin(timeStamp * (12.9898 + float(i+1) * 78.233)) * 43758.5453) * 50.0;
            } else {
                // Inactive star - mark with 0.0
                kval[i] = 0.0;
            }
        }
    
        // Write to buffer
        vec2 pixelCoord = floor(gl_FragCoord.xy);
        if (pixelCoord.x == 0. && pixelCoord.y == 0.) o.a = ID;
    
        for (int i=0; i<MAX_STARS; i++) {
            if (pixelCoord.x == float(i+1) && pixelCoord.y == 0.)
                o.a = kval[i];
        }
    }
 }