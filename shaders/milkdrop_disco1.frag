#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D surface;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel1 input0
#define iChannel2 surface

///////////////////////////////////////////////
// mcguirev10 - these were in Shadertoy Common, but only the second pass uses them

vec2 maxID(vec2 d1, vec2 d2)
{
    float m = max(d1.x, d2.x);
    if(m == d1.x)
        return d1;
    else
        return d2;
}

vec2 minID(vec2 d1, vec2 d2)
{
    float m = min(d1.x, d2.x);
    if(m == d1.x)
        return d1;
    else
        return d2;
}

float HexDist(vec2 p) 
{
	p = abs(p);
    
    float c = dot(p, normalize(vec2(1.,1.732050808)));
    c = max(c, p.x);
    
    return c;
}

struct hex
{
    float x;
    float y;
    float ang;
    float dist;
    vec2 id;
};

hex HexCoords(vec2 UV) 
{
    vec2 r = vec2(1., sqrt(3.));
    vec2 h = r*.5;
    
    vec2 a = mod(UV, r)-h;
    vec2 b = mod(UV-h, r)-h;
    
    vec2 gv = dot(a, a) < dot(b,b) ? a : b;
    
    float x = atan(gv.x, gv.y);
    float y = .5-HexDist(gv);
    vec2 id = UV - gv;
    
    vec4 hC = floor(vec4(UV, UV - vec2(.5, 1))/r.xyxy) + vec4(.5, .5, 1, 1.5);
    vec2 final_hC = dot(a, a) < dot(b,b) ? hC.xy : hC.zw;
    //final_hC = UV-gv;
    //angle, dist from center, id_x, id_y
    hex ret = hex(gv.x, gv.y, x, y, final_hC);
    return ret;
}

float sdHexPrism( vec3 p, vec2 h )
{
  const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
  p = abs(p);
  p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
  vec2 d = vec2(
       length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
       p.z-h.y );
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdSphere( vec3 p, float r)
{
    float sphereDist = length(p)-r;
    return sphereDist;
}

vec3 RotX (vec3 p, float speed)
{
    return vec3(p.x, p.y*cos(speed) + p.z*-sin(speed),  p.y*sin(speed) + p.z*cos(speed));
}

vec3 RotY (vec3 p, float speed)
{
    return vec3(p.x*cos(speed) + p.z*sin(speed), p.y, p.x*-sin(speed) + p.z*cos(speed));
}

vec3 RotZ (vec3 p, float speed)
{
    return vec3(p.x*cos(speed)  + p.y*-sin(speed), p.x*sin(speed) + p.y*cos(speed), p.z);
}

// Hash function by BigWings
vec2 N22(vec2 p)
{
    vec3 a = fract(p.xyx*vec3(123.34, 234.34, 345.65));
    a += dot(a, a+34.45);
    return fract(vec2(a.x*a.y, a.y*a.z));
}///////////////////////////////////////////////

///////////////////////////////////////////////
// Same for each pass (and #define won't work from a library)
    //#define BufA(x, y) texture(iChannel1, (vec2(x, y) + 0.5) / iResolution.xy)
    //#define BufA(x, y) texture(iChannel1, (vec2(x, y) + 0.1) / iResolution.xy)
    //#define BufA(x, y) texture(iChannel1, vec2(x, y) / iResolution.xy)
    #define BufA(x, y) texelFetch(iChannel1, ivec2(x, y), 0)

    #define GET_BASS_PURE BufA(0.,0.).x
    #define GET_BASS BufA(0.,3.).x
    #define GET_BASS_CONT BufA(0.,2.).x
    #define GET_MID_PURE BufA(1.,0.).x
    #define GET_MID BufA(1.,3.).x
    #define GET_MID_CONT BufA(1.,2.).x
    #define GET_TREB_PURE BufA(2.,0.).x
    #define GET_TREB BufA(2.,3.).x
    #define GET_TREB_CONT BufA(2.,2.).x
    #define GET_SOUND_PURE (GET_BASS_PURE + GET_MID_PURE + GET_TREB_PURE)/3.
    #define GET_SOUND (GET_BASS + GET_MID + GET_TREB)/3.
    #define GET_SOUND_CONT (GET_BASS_CONT + GET_MID_CONT + GET_TREB_CONT)/1.5
    float bass;
    float mid;
    float treb;
    float sound;
    float bass_cont;
    float mid_cont;
    float treb_cont;
    float sound_cont;
///////////////////////////////////////////////

#define PI 3.141592654
#define MaxSteps 50 // max steps for ray marching

#define CAM_SHAKE_X (sound_cont*0.225)
#define CAM_SHAKE_Z (sound_cont*0.262)
#define CAM_SHAKE_X_MAG (mid*mid*0.210075)
#define CAM_SHAKE_Z_MAG (mid*mid*0.205075)
#define CAM_SHAKE_Y_OFF (17.*pow(sound,4.))

#define SPACE_GIF_OFF (-mid_cont*0.5 - time)

#define TORUS_ROTY_SPEED (sound_cont*0.05)

#define SPHERE_ROTY_SPEED (-2.321*time)

#define LIGHT_POS_SPEED_MUL (.5)
#define LIGHT_POS_SPEED_X (treb_cont*LIGHT_POS_SPEED_MUL)
#define LIGHT_POS_SPEED_Z (mid_cont*LIGHT_POS_SPEED_MUL)

vec3 camerapos()
{
    vec3 ret = vec3(0., 18., 0.);
    ret.x = CAM_SHAKE_X_MAG*sin(CAM_SHAKE_X);
    ret.z = CAM_SHAKE_Z_MAG*cos(CAM_SHAKE_Z);
    ret.y -= CAM_SHAKE_Y_OFF;
    ret.y = min(15., ret.y);
    return ret;
}

vec3 cameralookat() 
{
    return camerapos()*vec3(1,0,1) + 0.001;
}

vec3 LightPos()
{
    vec3 ret = vec3(0.,10.,0.);
    float r = 10.;
    ret.x = sin(LIGHT_POS_SPEED_X)*r;
    ret.z = cos(LIGHT_POS_SPEED_Z)*r;
    return ret;
}

// By BigWings
vec3 SpaceGif(vec2 UV)
{
    UV.x += 0.285;
    UV.y += 0.26;
    vec3 col = vec3(0,0,0);
 
    UV *= 1.8;   
    vec2 gv = fract(UV) - 0.5;
    vec2 id = floor(UV);
    float m = 0.;
 
    for(int y = -1; y <= 1; y++)
    {
        for(int x = -1; x <= 1; x++)
        {
            vec2 offs = vec2(x,y);
            float d = length(gv - offs);
            float dist = length(id+offs)*0.9;
            float r = 0.51 + 0.5*sin(dist + SPACE_GIF_OFF);
            
            float uv_scale = 0.1;
            float r_mul = 0.5 - 0.3*sin(length(UV*uv_scale) + uv_scale * SPACE_GIF_OFF);
            
            float c = smoothstep(r, r*r_mul, d);
            m = m*(1.-c) + c*(1.-m);
        }
    }

    col = vec3(2,1,0.7);
    col *= m;
    
    return col;
}

vec3 toruscol(vec3 p, vec3 tpos, vec2 tsize, float rotspeed)
{
    vec3 a1 = vec3(0.5, 0.5, 0.5);
    vec3 b1 = vec3(0.5, 0.5, 0.5);
    vec3 c1 = vec3(1., 1., 1.)*3.*mid*mid*mid + time*0.3;// + time; // animate \ offset
    vec3 d1 = vec3(0.0, 0.33, 0.67);
    vec3 base_col = a1 + b1 * cos(2.*PI*(d1 + c1));


    float x = atan(p.x + tpos.x, p.z + tpos.z);
    float y = atan(length(p.xz + tpos.xz)-tsize.x, p.y + tpos.y);
    float speed = time * 7.;

    float f1 = smoothstep(0.4, 0.5, 0.5 + 0.5*cos(y*(30.*sin(time*0.5)) + x*15.));
    float f2 = smoothstep(0.4, 0.5, 0.5 + 0.5*sin(y*(30.*cos(time*0.5)) + x*15.));
    vec3 col = f1*f2*base_col;//vec3(1.000,0.933,0.110);

    return col;
}

vec3 Hive(vec2 UV, float mul, float add)
{
    vec3 col = vec3(0);
    UV *= mul;
    hex hc = HexCoords(UV + add);

    float c = smoothstep(0., 0.15, hc.dist*1.4  + 2.4*hc.dist*sin(hc.id.x*hc.id.y)*cos(hc.id.x*hc.id.y));
    float c2 = smoothstep(0., 0.15,hc.dist*sin(hc.id.x*hc.id.y+1.5*time)*cos(hc.id.x*hc.id.y+1.5*time));
    float c3 = smoothstep(0.01, 0.6, hc.dist*sin(hc.id.x*hc.id.y + 1.5*time)*cos(hc.id.x*hc.id.y+1.5*time));
    col = (1.-c)*normalize(vec3(1.,1.,0.3));
    col += c2*normalize(vec3(3.,1.4,0.));
    
    
    //col += c3*normalize(vec3(4.,1.4,0.));

    return col;
}

const vec3 torus1Pos = vec3(0., 1.5, 0.);
const vec2 torus1Size = vec2(sin(0.)*0.7 + 4.3, 1.);

vec3 spherePos = vec3(0,0,0);
float sphereRad = 1.3;

vec2 GetShapes(vec3 p)
{
//return vec2(0);
    return (1.35*sin(time*0. + sound_cont*0.02))*sin(2.*p.xz)
           + 0.025*sin(7.*p.zx + sound_cont*0.01)
           + 0.25 * cos(p.zx*3. + time);//*sin(time*0.421);
}

float sdTorus1(vec3 p, vec2 r) {
    float x = length(p.xz + GetShapes(p) )-r.x;
    return (length(vec2(x, p.y))-r.y);
}

vec3 torusTransform(vec3 p)
{
    p = RotY(p, TORUS_ROTY_SPEED);
    p = RotZ(p, p.x*0.01*p.z);
    
    return p;
}

vec3 sphereCol(vec3 p, vec3 spPos, float r)
{
    p*=1.6;
    vec3 n = normalize(p-r);
    float x = atan(n.x, n.z)/(2.*PI) + 0.5;
    float y = 0.5 + 0.5*n.y;
    vec3 col = 1.-Hive(vec2(x,y*0.5), 50., 0.);
    return col;
}

vec2 GetDist(vec3 p)
{
    float groundDist = p.y;
    float groundID = 1.;
    // torus
    vec3 pNew = torusTransform(p);
    float torusDist = sdTorus1(pNew - torus1Pos, torus1Size);
    float torusID = 2.;

    // sphere
    float sphereDist = sdSphere(p - spherePos, sphereRad);
    float sphereID = 3.;
    float shape = min(groundDist, torusDist);   
    //shape = min(shape, torus2Dist);
    shape = min(shape, sphereDist);
    vec2 toreturn; 
    if(shape == groundDist)
        toreturn = vec2(groundDist, groundID);
    if(shape == torusDist)
         toreturn = vec2(torusDist, torusID);   
     if(shape == sphereDist)
         toreturn = vec2(sphereDist, sphereID);
     return toreturn;
}

vec3 RayMarch(vec3 ro, vec3 rd, int steps) 
{
    vec2 dS;
    float dO;
    vec3 p;
    for(int i = 0; i<steps; i++)
    {
        p = ro + rd * dO;
        dS = GetDist(p);
        if(dS.x < 0.0001) {break;}
        dO += dS.x;
    }     
    return vec3(dO,dS);
}

vec3 GetNormal(vec3 p)
{
    float d = GetDist(p).x;
    vec2 e = vec2(.01, 0);
 
    vec3 n = d-vec3(GetDist(p-e.xyy).x, 
                        GetDist(p-e.yxy).x, 
                        GetDist(p-e.yyx).x);
    return normalize(n);
}

float GetLight(vec3 p, vec3 normal, vec3 lightpos, float lightpower, float shadowstrength, int steps)
{
    vec3 l = normalize(lightpos - p);
    float dif = clamp(dot(normal, l*lightpower), 0., 1.);
    if(steps > 0) // shadows
    {
        float d = RayMarch(p + normal*0.2, l, steps).x;
        if(d < length(lightpos-p))
            dif *= shadowstrength;
    }
    return dif;
}

float specularReflection(vec3 p, vec3 normal, vec3 rd, vec3 lightPos, float intensity, float shininessVal)
{
    vec3 L = normalize(lightPos - p);
    float lambertian = max(dot(L, normal), 0.0);
    float specular = 0.;
  	if(lambertian > 0.0 ) {
        vec3 R = reflect(-L, normal); // Reflected light vector
        vec3 V = normalize(-rd); // Vector to viewer
        // Compute the specular term
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, shininessVal);
  	}
    return specular * intensity;
}

float calcOcclusion(vec3 p) // calcOcclusion by iq
{
    vec3 n = GetNormal(p);
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float h = 0.01 + 0.11*float(i)/4.0;
        vec3 opos = p + h*n;
        float d = GetDist(opos).x;
        occ += (h-d)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 2.0*occ, 0.0, 1.0 );
}

vec3 GetCol(vec3 ro, vec3 rd, vec3 p, vec3 d) 
{
    vec3 ret = vec3(0);
    vec3 n = GetNormal(p);
	float dif = GetLight(p, n, LightPos(), 1., 0.,  0); //***
    float spRef = specularReflection(p, n, rd, LightPos(), 1., 5.);

    if(d.z == 1.) // Floor Col
    {        
        vec3 gif = SpaceGif(p.xz);
        vec3 hive = Hive(p.xz, 2., 100.)*dif;
        float hex = smoothstep(-0.7,1.,sin(HexDist(p.xz)*0.9 - time*2.));
        //ret = lum(hex)*hive;
        ret = dot(ret, vec3(0.2126, 0.7152, 0.0722))*vec3(hex) * hive;
        // apply gif
        ret = vec3(gif * hex);
        ret += hive * (1.-hex);
        
        // fire look at the center
        //ret *= gif;

        vec3 circle;
        float circler = 4.;
        circle = vec3(smoothstep(circler, circler+10., length((p.xz ))));
        ret -= circle*ret;
        circle *= (hive);
        ret += circle;
        
        
        
        // add some "lava" at the edges of the screen
        // rotate for hiding the line caused by polar coordinate
        p.xz = RotY(vec3(p.x,1.,p.z), -0.8).xz;
        vec2 lava_uv_polar;
        lava_uv_polar.x = (length(p.xz))*0.1;
        lava_uv_polar.y = atan(p.x,p.z);
        lava_uv_polar *= 3.;
        vec3 tex = 5.*pow(texture(iChannel2,lava_uv_polar).xyz, vec3(5.));
        tex = clamp(tex, 0., 1.);
        float tex_mask = smoothstep(0.03, 0.18,length(p.xz*0.015)); 
        
        ret = mix(ret, ret*tex.xxx*vec3(0.918,0.408,0.035), tex_mask);
        
        //ret *= dif;

        ret += spRef*0.3;
        //ret = vec3(1.);
        float sphere_mask = smoothstep(sphereRad*0.5, sphereRad*1.8, length(p.xz));
        ret *= sphere_mask;
        //ret += 1.-sphere_mask;
    }
    if(d.z == 2.) // Torus Col
    {        
        ret = vec3(1);
        vec3 pNew = torusTransform(p);
        vec3 col =  toruscol(pNew, torus1Pos, torus1Size, 0.);
        ret = dif*col;
        ret += spRef;
    }
    if(d.z == 3.) // Sphere Col
    {
        ret = sphereCol(RotZ(RotX(RotY(p,SPHERE_ROTY_SPEED), PI + 0.8), -0.9), spherePos, sphereRad);
        ret *= dif;
        
        float edge_mask = smoothstep(sphereRad, sphereRad*0.8, length(p.xz));
        ret *= edge_mask;
        //ret += 1.-edge_mask;

        //ret += spRef;

    }

    return ret;
}

vec3 getScene(vec2 uv)
{
    vec3 ret = vec3(0);
    
    vec3 lookat = cameralookat();
    float zoom = 1.;// + 0.15*sin(time*0.4);//0.5 + 0.3*sin(time*0.326);
    vec3 ro = camerapos();
    
    vec3 F = normalize(lookat-ro); // Forward
    vec3 Ri = normalize(cross(vec3(0., 1., 0.), F)); //Right
    vec3 U = cross(F, Ri); //Up
    vec3 C = ro + F*zoom;
    vec3 I = C + uv.x*Ri + uv.y*U;
    vec3 rd = normalize(I-ro);
    
    vec3 d = RayMarch(ro,rd, MaxSteps);
    vec3 p = ro + rd*d.x;
    
    ret = GetCol(ro, rd, p, d);
    
    return ret;
}

void main()
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 R = iResolution.xy,
    //uv = fragCoord / R.y;                     // [0,1] vertically
    //uv = ( 2.*fragCoord - R ) / R.y;          // [-1,1] vertically
    //uv = ( fragCoord - .5*R ) / R.y;          // [-1/2,1/2] vertically
    //uv = ( 2.*fragCoord - R ) / min(R.x,R.y); // [-1,1] along the shortest side

    uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    bass = GET_BASS;
    mid = GET_MID;
    treb = GET_TREB;
    sound = GET_SOUND;
    bass_cont = GET_BASS_CONT;
    mid_cont = GET_MID_CONT;
    treb_cont = GET_TREB_CONT;
    sound_cont = GET_SOUND_CONT;

    vec3 col = getScene(uv);
    
    //col = SpaceGif(uv*15.);//
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
