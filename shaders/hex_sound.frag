#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float frame;
uniform float time;
uniform sampler2D eyecandyShadertoy;
uniform sampler2D iChannel0;
out vec4 fragColor;

int iFrame = int(frame);
#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel1 eyecandyShadertoy
#define iTime time

// Max ray distance.
#define FAR 20.

// Apply some glow. It only really looks right on larger objects, so 
// "HEX_SCALE" is set to 6 when this is turned on.
#define GLOW

// Hexagonal scale: It's based on hexagons per unit area, so larger numbers
// give more detail. Detail allows the sound pattern to emerge, but doesn't
// look as interesting from a 3D perspective. The default attempts to give
// the best of both worlds.
#ifdef GLOW
#define HEX_SCALE 6. // Glow looks better with larger objects.
#else
#define HEX_SCALE 12. // No glow, so give it more definition.
#endif




// Scene object ID to separate the mesh object from the terrain.
float objID;


// Camera's XY movement. 
vec2 camXY;

// Standard 2D rotation formula.
mat2 rot2(in float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }


// IQ's vec2 to float hash.
float hash21(vec2 p){  return fract(sin(dot(p, vec2(27.609, 57.583)))*43758.5453); }


// 2D texture read.
vec3 getTex(vec2 p){
    
    // Strething things out so that the image fills up the window. You don't need to,
    // but this looks better. I think the original video is in the oldschool 4 to 3
    // format, whereas the canvas is along the order of 16 to 9, which we're used to.
    // If using repeat textures, you'd comment the first line out.
    //p *= vec2(iResolution.y/iResolution.x, 1);
    vec3 tx = texture(iChannel0, fract(p/4. + .5)).xyz;
    return tx*tx; // Rough sRGB to linear conversion.
}


// Tri-Planar blending function. Based on an old Nvidia writeup:
// GPU Gems 3 - Ryan Geiss: http://http.developer.nvidia.com/GPUGems3/gpugems3_ch01.html
vec3 tex3D( sampler2D tex, in vec3 p, in vec3 n ){    
    
    // Ryan Geiss effectively multiplies the first line by 7. It took me a while to realize that 
    // it's largely redundant, due to the division process that follows. I'd never noticed on 
    // account of the fact that I'm not in the habit of questioning stuff written by Ryan Geiss. :)
    n = max(n*n - .2, .001); // max(abs(n), 0.001), etc.
    n /= dot(n, vec3(1)); 
    //n /= length(n); 
    
    // Texure samples. One for each plane.
    vec3 tx = texture(tex, p.yz).xyz;
    vec3 ty = texture(tex, p.zx).xyz;
    vec3 tz = texture(tex, p.xy).xyz;
    
    // Multiply each texture plane by its normal dominance factor.... or however you wish
    // to describe it. For instance, if the normal faces up or down, the "ty" texture sample,
    // represnting the XZ plane, will be used, which makes sense.
    
    // Textures are stored in sRGB (I think), so you have to convert them to linear space 
    // (squaring is a rough approximation) prior to working with them... or something like that. :)
    // Once the final color value is gamma corrected, you should see correct looking colors.
    return mat3(tx*tx, ty*ty, tz*tz)*n; // Equivalent to: tx*tx*n.x + ty*ty*n.y + tz*tz*n.z;

}

// vec2 to vec2 hash.
vec2 hash22(vec2 p) { 

    // Faster, but doesn't disperse things quite as nicely. However, when framerate
    // is an issue, and it often is, this is a good one to use. Basically, it's a tweaked 
    // amalgamation I put together, based on a couple of other random algorithms I've 
    // seen around... so use it with caution, because I make a tonne of mistakes. :)
    float n = sin(dot(p, vec2(27, 57)));
    //return fract(vec2(262144, 32768)*n)*2. - 1.; 
    
    // Animated.
    p = fract(vec2(262144, 32768)*n)*2. - 1.;
    return sin(p*6.2831853 + iTime*2.); 
    
}

// vec3 to float.
float hash31(vec3 p){
    return fract(sin(dot(p, vec3(12.989, 78.233, 57.263)))*43758.5453);
}

// Based on IQ's gradient noise formula.
float n2D3G( in vec2 p ){
   
    vec2 i = floor(p); p -= i;
    
    vec4 v;
    v.x = dot(hash22(i), p);
    v.y = dot(hash22(i + vec2(1, 0)), p - vec2(1, 0));
    v.z = dot(hash22(i + vec2(0, 1)), p - vec2(0, 1));
    v.w = dot(hash22(i + 1.), p - 1.);

#if 1
    // Quintic interpolation.
    p = p*p*p*(p*(p*6. - 15.) + 10.);
#else
    // Cubic interpolation.
    p = p*p*(3. - 2.*p);
#endif

    return mix(mix(v.x, v.y, p.x), mix(v.z, v.w, p.x), p.y);
    
}


// Height map value, which is just some sound data converted to 2D and 
// a texture read.
float hm(in vec2 p){ 
    
     
    float sndSc = 2.;
    vec2 hPos = p/sndSc;
    
    // Test height, for debugging purposes.
    //float ns2 = n2D3G(hPos*2. + iTime/2.)*.57 + n2D3G(hPos*4. + iTime)*.34;
    //ns2 = ns2*.5 + .5;
    //return ns2;
    
    
    // Surface position.
    vec2 sHPos = hPos - camXY/sndSc;
    

    // The sound texture has dimensions 512x2, with the first row containing frequency data.
    // mcguirev10 - eyecandy is 1024x2
    //int ci = int(length(sHPos)*256.);
    int ci = int(length(sHPos)*512.);
    float fft  = texelFetch(iChannel1, ivec2(ci, 0), 0).y;

    // The second row is the sound wave.
    //int sTx = int(sHPos.x*280. + 256.);
    int sTx = int(sHPos.x*560. + 512.);
    float wave = texelFetch(iChannel1, ivec2(sTx, 1), 0 ).y;   


    float layer = fft;
    float intensity = fft; //mix(wave, fft, .5);

    // The sound data alone has a lot of inactive periods, so we add in some 
    // background noise just to keep things visually interesting.
    float ns = n2D3G(hPos*2.5)*.57 + n2D3G(hPos*5.)*.34;
    ns = ns*.5 + .5;

    // Blinking lights function.
    float blink = smoothstep(0., .1, mix(ns - .5, intensity - .5, .35));
    
    // Mix the texture with the blink height and return.
    return dot(getTex(p), vec3(.299, .587, .114))*1.5 + blink; 


}

// IQ's extrusion formula.
float opExtrusion(in float sdf, in float pz, in float h){
    
    vec2 w = vec2( sdf, abs(pz) - h );
  	return min(max(w.x, w.y), 0.) + length(max(w, 0.));

    /*
    // Slight rounding. A little nicer, but slower.
    const float sf = .025;
    vec2 w = vec2( sdf, abs(pz) - h - sf/2. );
  	return min(max(w.x, w.y), 0.) + length(max(w + sf, 0.)) - sf;
    */
}

/*
// IQ's unsigned box formula.
float sBoxS(in vec2 p, in vec2 b, in float sf){

  return length(max(abs(p) - b + sf, 0.)) - sf;
}


// This is a bound. Technically, it's not a proper distance field, but for
// this example, no one will notice. :)
float sHexS(in vec2 p, in vec2 b){
    
    p = abs(p);
    return max(p.x*.8660254 + p.y*.5 - b.x, p.y - b.y);
    //return max(p.y*.8660254 + p.x*.5, p.x) - b.x;;
}
*/

// Signed distance to a regular hexagon, with a hacky smoothing variable thrown
// in. -- It's based off of IQ's more exact pentagon method, which is here:
float sHexS(in vec2 p, float r, in float sf){
    
    
      const vec3 k = vec3(-.8660254, .5, .57735); // pi/6: cos, sin, tan.

      // X and Y reflection.  
      p = abs(p); 
      p -= 2.*min(dot(k.xy, p), 0.)*k.xy;


      r -= sf;
      // Polygon side.
      return length(p - vec2(clamp(p.x, -k.z*r, k.z*r), r))*sign(p.y - r) - sf;
    
}

// Signed distance to a regular hexagon, with a hacky smoothing variable thrown
// in. -- It's based off of IQ's more exact pentagon method, which is here:
float sCylS(in vec2 p, float r){
  
  return length(p) - r;
    
}

/*
// IQ's signed box formula.
float sBoxS(in vec2 p, in vec2 b, in float sf){
   

  vec2 d = abs(p) - b + sf;
  return min(max(d.x, d.y), 0.) + length(max(d, 0.)) - sf;
}
*/
 
// A regular extruded block grid.
//
// The idea is very simple: Produce a normal grid full of packed pylons.
// That is, use the grid cell's center pixel to obtain a height value (read in
// from a height map), then render a pylon at that height.

vec4 blocks(vec3 q3){
    
    // Scale.
    //#define STRETCH
    #ifdef STRETCH
	const vec2 scale = vec2(1./HEX_SCALE, 1./HEX_SCALE);
     // Brick dimension: Length to height ratio with additional scaling.
	const vec2 l = vec2(scale.x*1.732/2., scale.y);
    #else
    const float scale = 1./HEX_SCALE;
     // Brick dimension: Length to height ratio with additional scaling.
	const vec2 l = vec2(scale*1.732/2., scale);
    #endif
    
   
    // A helper vector, but basically, it's the size of the repeat cell.
	const vec2 s = l*2.;
    
    // Distance.
    float d = 1e5;
    // Cell center, local coordinates and overall cell ID.
    vec2 p, ip;
    
    // Individual brick ID.
    vec2 id = vec2(0);
    vec2 cntr = vec2(0);
    
    // For block corner postions.
    //const vec2[4] ps4 = vec2[4](vec2(-l.x, l.y), l, -l, vec2(l.x, -l.y));
    // Pointed top.
    //const vec2[4] ps4 = vec2[4](vec2(-l.x, l.y), l, -l + vec2(l.x, 0), vec2(l.x, -l.y) + vec2(l.x, 0));
    // Flat top.
    const vec2[4] ps4 = vec2[4](vec2(-l.x, l.y), l + vec2(0., l.y), -l, vec2(l.x, -l.y) + vec2(0., l.y));
    
    float boxID = 0.; // Box ID. Not used in this example, but helpful.
    
    for(int i = 0; i<4; i++){

        // Block center.
        cntr = ps4[i]/2.;


        // Local coordinates.
        p = q3.xy - cntr;
        ip = floor(p/s) + .5; // Local tile ID.
        p -= (ip)*s; // New local position.

       
        // Correct positional individual tile ID.
        vec2 idi = (ip)*s + cntr;
 
        // The extruded block height. See the height map function, above.
        float h = hm(idi);
        
        // Or just, "h *= .1," for nondiscreet heights.
        //h = floor(h*15.999)/15.*.1; 
        h *= .1;
        
            
        // The hexagonal cross section. The corners are slightly rounded on this
        // version, but they don't have to be.
        #ifdef STRETCH
        vec2 lu = l/vec2(1.732/2., 1);
        vec2 pStretch = lu.x<lu.y? vec2(1, lu.x/lu.y) : vec2(lu.y/lu.x, 1);
        float r = min(lu.x, lu.y)/2.;
        float di2D = sHexS(p*pStretch, r - .035*r, .2*r);
        #else
        float di2D = sHexS(p, scale/2. + .035*scale, .2*scale);
        //float di2D = sCylS(p, scale/2.);
        #endif

        // Boring out some of the lower boxes. I like it, but thought it
        // confused matters.
        //if(h<1./15.*.15 + .001) di2D = max(di2D, -(di2D + .3*scale));

        // The extruded distance function value.
        float di = opExtrusion(di2D, (q3.z + h), h);

        // If applicable, update the overall minimum distance value,
        // ID, and box ID. 
        if(di<d){
            d = di;
            id = idi;
            // Not used in this example, so we're saving the calulation.
            //boxID = float(i);
        }
        
    }
    
    // Return the distance, position-base ID and box ID.
    return vec4(d, id, boxID);
}


// Block ID -- It's a bit lazy putting it here, but it works. :)
vec2 gID;

// The extruded image.
float map(vec3 p){
    
    // Floor.
    float fl = -p.z + .1;

    // The extruded blocks.
    vec4 d4 = blocks(p);
    gID = d4.yz; // Individual block ID.
    
 
    // Overall object ID.
    objID = fl<d4.x? 1. : 0.;
    
    // Combining the floor with the extruded image
    return  min(fl, d4.x);
 
}

// Glow.
vec3 gGlow;
 
// Basic raymarcher.
float trace(in vec3 ro, in vec3 rd){

    // Overall ray distance and scene distance.
    float t = 0., d;
    
    gGlow = vec3(0);
    
    for(int i = min(iFrame, 0); i<80; i++){
    
        d = map(ro + rd*t);
        
        float ad = abs(d + (hash31(rd) - .5)*.05);
        if(ad<1.){
            float l2D = ad;//1./(1. + abs(ad));// t; //
            //if(objID == 0.) 
            	gGlow += .25*(1. - l2D)/(1. + l2D)/(1. + t);
        }

        
        // Note the "t*b + a" addition. Basically, we're putting less emphasis on accuracy, as
        // "t" increases. It's a cheap trick that works in most situations... Not all, though.
        if(d*d<1e-6 || t>FAR) break; // Alternative: 0.001*max(t*.25, 1.), etc.
        
        //t += i<32? d*.75 : d; 
        t += d*.7;
    }

    return min(t, FAR);
}


// Standard normal function. It's not as fast as the tetrahedral calculation, but more symmetrical.
vec3 getNormal(in vec3 p, float t) {
	const vec2 e = vec2(.001, 0);
	return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy),	map(p + e.yyx) - map(p - e.yyx)));
}


// Cheap shadows are hard. In fact, I'd almost say, shadowing particular scenes with limited 
// iterations is impossible... However, I'd be very grateful if someone could prove me wrong. :)
float softShadow(vec3 ro, vec3 lp, vec3 n, float k){

    // More would be nicer. More is always nicer, but not really affordable... Not on my slow test machine, anyway.
    const int maxIterationsShad = 24; 
    
    ro += n*.0015;
    vec3 rd = lp - ro; // Unnormalized direction ray.
    

    float shade = 1.;
    float t = 0.;//.0015; // Coincides with the hit condition in the "trace" function.  
    float end = max(length(rd), 0.0001);
    //float stepDist = end/float(maxIterationsShad);
    rd /= end;

    // Max shadow iterations - More iterations make nicer shadows, but slow things down. Obviously, the lowest 
    // number to give a decent shadow is the best one to choose. 
    for (int i = min(iFrame, 0); i<maxIterationsShad; i++){

        float d = map(ro + rd*t);
        shade = min(shade, k*d/t);
        //shade = min(shade, smoothstep(0., 1., k*h/dist)); // Subtle difference. Thanks to IQ for this tidbit.
        // So many options here, and none are perfect: dist += min(h, .2), dist += clamp(h, .01, stepDist), etc.
        t += clamp(d, .01, .25); 
        
        
        // Early exits from accumulative distance function calls tend to be a good thing.
        if (d<0. || t>end) break; 
    }

    // Sometimes, I'll add a constant to the final shade value, which lightens the shadow a bit --
    // It's a preference thing. Really dark shadows look too brutal to me. Sometimes, I'll add 
    // AO also just for kicks. :)
    return max(shade, 0.); 
}


// I keep a collection of occlusion routines... OK, that sounded really nerdy. :)
// Anyway, I like this one. I'm assuming it's based on IQ's original.
float calcAO(in vec3 p, in vec3 n)
{
	float sca = 3., occ = 0.;
    for( int i = 0; i<5; i++ ){
    
        float hr = float(i + 1)*.15/5.;        
        float d = map(p + n*hr);
        occ += (hr - d)*sca;
        sca *= .7;
    }
    
    return clamp(1. - occ, 0., 1.);  
    
    
}


void main(){

    
    // Screen coordinates.
	vec2 uv = (fragCoord - iResolution.xy*.5)/iResolution.y;
	
    
	// Camera Setup.
    camXY = vec2(1.732, 1)*iTime/4.;
	vec3 ro = vec3(camXY.x, camXY.y - 1., -2.5); // Camera position, doubling as the ray origin.
	vec3 lk = ro + vec3(0, .07, .25);//vec3(0, -.25, iTime);  // "Look At" position.
 
    // Light positionin. One is just in front of the camera, and the other is in front of that.
 	vec3 lp = ro + vec3(.5, 1.5, 1.5);// Put it a bit in front of the camera.
	

    // Using the above to produce the unit ray-direction vector.
    float FOV = 1.33; // FOV - Field of view.
    vec3 fwd = normalize(lk-ro);
    vec3 rgt = normalize(vec3(fwd.z, 0., -fwd.x )); 
    // "right" and "forward" are perpendicular, due to the dot product being zero. Therefore, I'm 
    // assuming no normalization is necessary? The only reason I ask is that lots of people do 
    // normalize, so perhaps I'm overlooking something?
    vec3 up = cross(fwd, rgt); 

    // rd - Ray direction.
    //vec3 rd = normalize(fwd + FOV*uv.x*rgt + FOV*uv.y*up);
    vec3 rd = normalize(uv.x*rgt + uv.y*up + fwd/FOV);
    
    // Swiveling the camera about the XY-plane.
	//rd.xy *= rot2( sin(iTime)/32. );

	 
    
    // Raymarch to the scene.
    float t = trace(ro, rd);
    
    // Save the block ID and object ID.
    vec2 svGID = gID;
    
    float svObjID = objID;
    
    vec3 svGlow = gGlow;
  
	
    // Initiate the scene color to black.
	vec3 col = vec3(0);
	
	// The ray has effectively hit the surface, so light it up.
	if(t < FAR){
        
  	
    	// Surface position and surface normal.
	    vec3 sp = ro + rd*t;
	    //vec3 sn = getNormal(sp, edge, crv, ef, t);
        vec3 sn = getNormal(sp, t);
        
        
            	// Light direction vector.
	    vec3 ld = lp - sp;

        // Distance from respective light to the surface point.
	    float lDist = max(length(ld), .001);
    	
    	// Normalize the light direction vector.
	    ld /= lDist;

        
        
        // Shadows and ambient self shadowing.
    	float sh = softShadow(sp, lp, sn, 8.);
    	float ao = calcAO(sp, sn); // Ambient occlusion.
        sh = min(sh + ao*.25, 1.);
	    
	    // Light attenuation, based on the distances above.
	    float atten = 1./(1. + lDist*.05);

    	
    	// Diffuse lighting.
	    float diff = max( dot(sn, ld), 0.);
        //diff = pow(diff, 4.)*2.; // Ramping up the diffuse.
    	
    	// Specular lighting.
	    float spec = pow(max(dot(reflect(ld, sn), rd ), 0.), 16.); 
	    
	    // Fresnel term. Good for giving a surface a bit of a reflective glow.
        float fre = pow(clamp(1. - abs(dot(sn, rd)*.5), 0., 1.), 2.);
        
		// Schlick approximation. I use it to tone down the specular term. It's pretty subtle,
        // so could almost be aproximated by a constant, but I prefer it. Here, it's being
        // used to give a hard clay consistency... It "kind of" works.
		float Schlick = pow( 1. - max(dot(rd, normalize(rd + ld)), 0.), 5.);
		float freS = mix(.15, 1., Schlick);  //F0 = .2 - Glass... or close enough.        
        

        
          
        // Obtaining the texel color. 
	    vec3 texCol;   

        // The extruded grid.
        if(svObjID<.5){
            
            // Coloring the individual blocks with the saved ID, then using it in conjunction
            // with sound files to color a height map.
            
            // Sound visual scale, ID, surface position.
            const float sndSc = 2.;
            vec2 hPos = svGID/sndSc;
            vec2 sHPos = (hPos - camXY/sndSc);
            vec2 hPos2 = (sp.xy - svGID)/sndSc;
            
            //    float eDist = hex(hPos2.xy); // Edge distance.
            float cDist = dot(hPos2.xy, hPos2.xy); // Relative squared distance from the center.
  


            // The sound texture has dimensions 512x2, with the first row containing frequency data.
            //int ci = int(length(sHPos)*256.);
            // mcguirev10 - eyecandy has 1024x2
            int ci = int(length(sHPos)*512.);
            float fft  = texelFetch(iChannel1, ivec2(ci, 0), 0).g;

            // The second row is the sound wave.
            //int sTx = int(sHPos.x*280. + 256.);
            int sTx = int(sHPos.x*560. + 512.);
            float wave = texelFetch(iChannel1, ivec2(sTx, 1), 0).g;


            float layer = fft;
            float intensity = fft; //mix(wave, fft, .5);

            // The sound data alone has a lot of inactive periods, so we add in some 
            // background noise just to keep things visually interesting.
            float ns = n2D3G(hPos*2.5)*.57 + n2D3G(hPos*5.)*.34;
            ns = ns*.5 + .5;

            // Blinking lights function.
            float blink = smoothstep(0., .1, mix(ns - .5, intensity - .5, .35));

            // Blending.
            float blend = n2D3G(hPos*4. + intensity*1.)*.5 + .5;
 
 
            // Texture reads.
            //vec3 tx = getTex(svGID);
            // vec3 tx = getTex(sp.xz);
            vec3 tx = tex3D(iChannel0, sp/4. - .5, sn);
            tx = smoothstep(0., .5, tx);
            vec3 tx2 = texture(iChannel0, hPos*1.).xyz; tx2 *= tx2;
            tx = smoothstep(-.05, .8, tx)*vec3(1, .8, .6);
            tx2 = smoothstep(-.05, .8, tx2)*vec3(1, .8, .6);
            
            // Using the information above to mix in some color.
            // All of this is made up, so I wouldn't pay it too much attention.
            vec3 hCol = mix(tx, tx2, .65);
            float sh = max(1. - cDist*2., 0.);
            //vec3 colMix = pow(vec3(1.5, 1, 1)*blend, vec3(1, 2.5, 16))*5.;//
            vec3 colMix = mix(vec3(1, .1, .2), vec3(1, .7, .35), blend)*5.;
            //vec3 colMix = .5 + .25*cos(6.2831*mix(.0, 1., blend) + vec3(0, 1, 2))*5.;
            //colMix = mix(colMix.zyx, colMix.xzy*2., sin(intensity*3.14159*2.5 + 3.14159/4.)*.8 + .6);
            colMix = mix(colMix.zyx, colMix.xzy*2., smoothstep(0., 1., n2D3G(hPos*(3. - layer/8.)))*1.25 - .125);
            colMix = mix(colMix.zyx, colMix.xzy*2., smoothstep(.5, 1.5, sin(mix(ns - .5, intensity - .475, .5)*3.14159*5.))*1.25 - .125);
            colMix = mix(colMix, colMix.zyx, .1);

            hCol = mix(hCol/4., hCol*colMix, blink); // Blended, blinking orange.
            hCol *= sh*.8 + .4;


            // Putting little black borders on the hexagon faces.
            vec2 q = hPos2;
            float sf = .002;
            const float sc = 1./HEX_SCALE/sndSc;
            const float lw = sc*.1;
            float eDist = sHexS(q, sc/2. + .035*sc, .2*sc);
            eDist = abs(eDist) - lw;
            float ht = hm(svGID);
            
            // Darker sides with a black rim.
            //hCol = mix(hCol, vec3(0), (1. - smoothstep(0., sf, eDist))*.9);
            //eDist = max(eDist, abs(sp.z + ht*.1*2.) - lw/1.); // No black sides.
            hCol = mix(hCol, vec3(0), (1. - smoothstep(0., sf, eDist))); // Just the rim.
            //float cDist2 = dot(hPos2.xy - .07, hPos2.xy - .07);
            //hCol = mix(hCol, hCol*2., (1. - smoothstep(0., sf*2., cDist2 - max(-dot(rd, ld), 0.)*.01)));

			// A simple lined pattern along the top.
            float pat = abs(fract((sp.y*.8860254 + sp.x*.5)*42.) - .5)*2. - .25;  
            hCol = mix(hCol, vec3(0), (1. - smoothstep(0., .25, pat))*.5);
                 
            
            texCol = hCol;
             
        }
        else {
            
            // The dark floor in the background. Hiddent behind the pylons, but
            // you still need it.
            texCol = vec3(0);
        }
       
    	

        
        
        // Combining the above terms to procude the final color.
        col = texCol*(diff + ao*.3 + vec3(.2, .4, 1)*fre*0. + vec3(1, .5, .2)*spec*2.);
        

    
        // Shading.
        col *= ao*sh*atten;
        
        
        //if(objID == 1.) svGlow *= texCol;
        svGlow *= (ao*sh*atten*.65 + .35);
      
        
	
	}
    

    
    // Applying the glow.
    #ifdef GLOW    
    // Applying a fiery palatte to the glow
    vec3 glowCol = pow(vec3(1.5, 1, 1)*svGlow, vec3(1, 2, 3).zyx*2.);
    
    // The fiery red is a little overwhelming, so this tones it down a bit.
    //glowCol = mix(glowCol, glowCol.zyx, max(-rd.y*.25 + .1, 0.));

    // Adding the glow to the scene. Not that it's applied outsite the the object coloring
    // block because we need to add the glow to the empty spaces as well. When I haven't applied
    // glow for a while, I tend to forget this. :)
    col = mix(col, glowCol, glowCol);// + glowCol*glowCol*1.5;
    
    #endif


          
    
    // Rought gamma correction.
	fragColor = vec4(sqrt(max(col, 0.)), 1);
	
}