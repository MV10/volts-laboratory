#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

/*
 - Angular Beat Box Grid: Leonid Zaides
 - 
 - 
 - Warping angular grid by constructing 3 levels of cylindrical coordinates (first from carthesian then 
 - from the constructed cylindrical and one more like that) and interpolating between them.
 - 
 - Coloring is done by static color palettes.
 - 
 - Anti-Aliasing: 
 - 1) Using analytic derivatives for the 'bumps' (on mobile this was significantly faster than dFdx,dFdy). 
 -    This makes cleaner gradients.
 - 2) The radial edges of the cells are interpolated by calculateing 2 cell neighbors.
 - 3) The (running) radial lines are filterd by taking 4 samples.
 -
 - Buffer A: precomputing frame parameters and constants.
 -
 - Added per cell sound activation.
 */

float hash(in float _x) { return fract(5313.235 * mod(_x, 0.75182) * mod(_x, 0.1242)); }
float noise(in float _x) { float i = floor(_x); float f = fract(_x); return mix(hash(i), hash(i + 1.), 3.*f*f - 2.*f*f*f); }
vec3 smbox(in vec2 _f, in vec2 _t, in float _eps, in vec2 _uv) { vec2 bin = smoothstep(_f - _eps, _f, _uv) - smoothstep(_t, _t + _eps, _uv); return vec3(bin, bin.x * bin.y);}

#define ANIM_T(_t, _e, _p) (smoothstep(_p - _e, _p, _t) - smoothstep(_p, _p + _e, _t))
#define PULSE_T(_t, _e, _pa, _pb) (smoothstep(_pa - _e, _pa, _t) - smoothstep(_pb, _pb + _e, _t))
#define ASYM_PULSE_T(_t, _ea, _pa, _eb, _pb) (smoothstep(_pa - _ea, _pa, _t) - smoothstep(_pb, _pb + _eb, _t))

#define ROT2D(p2d, ang) (cos(ang) * p2d.xy + sin(ang) * vec2(p2d.y, -p2d.x))
#define TEX_LIGHT 4
#define DF(_x, _m) 6. * (_x * _m - (_x * _x) / (_m * _m) )
#define DRV(_x, _m) DF(_x, _m) * (step(0., _x) - step(_m, _x)) + (1. - DF(_x, _m)) * (step(1. - _m, _x) - step(1., _x))

#define GET_PALETTE(_f) ((_f < 0.25) ? 0 : (_f < 0.5) ? 1 : (_f < 0.75) ? 2 : 3)

//const vec4 lights[NLIGHTS] = vec4[NLIGHTS](vec4(0., 0., 5., 1.));
const vec2 vhex = normalize(vec2(1., 0.5));
const float hexh = 0.8660254037; // = sqrt(3) / 2;
const float inv_hexh = 1.15470053837;
const vec2 hexGrid = vec2(3., sqrt(3.));

#define GRID_SIZE 5.
#define N_RAD_COLS 4
#define TEX_RAD_COLS 5
#define TEX_FRAME_CONSTS 6
#define TEX_SOUND 7
#define TEX_GRID_COL 12
#define TEX_GRID_COL2 13
#define TEX_GRID_COL3 14
#define TEX_GRID_COL4 15

// mcguirev10: eyecandy has twice the sound resolution
//#define SOUND_BINS 128.
#define SOUND_BINS 256.

#define FLW(_grid) ASYM_PULSE_T(mod(_grid.y + floor(_grid).x, 15.), 0.2, 2.5, 0.2, 2.6)
#define RMARGIN(_grid) 0.05 * (1. + 0.5 * FLW(_grid))
#define radialLine(_grid) ANIM_T(fract(_grid.x), RMARGIN(_grid), 0.5) * mix(0.9, 1.0, 0.5 + 0.5 * sin(6.28 * fract(_grid.y)))

#define TR(_i, _layer) texelFetch(iChannel0, ivec2(_i, _layer), 0).r
#define TF(_i, _layer) texelFetch(iChannel0, ivec2(_i, _layer), 0)

#define N_GRID_COLS 15.

#define CLT(_id, _noise, _c) TF(int(hash(_id) * _noise * N_GRID_COLS), _c).rgb

vec4 hexgrid(in vec2 _uv)
{
  vec4 res;
  vec2 a = mod(_uv + 0.5 * hexGrid, hexGrid) - 0.5 * hexGrid;
  vec2 b = mod(_uv, hexGrid) - hexGrid * 0.5;
  
  vec2 fa = vec2(dot(abs(a), vhex), abs(a.y));
  vec2 fb = vec2(dot(abs(b), vhex), abs(b.y));
  
  float ma = max(fa.x, fa.y);
  float mb = max(fb.x, fb.y);
  
  vec2 bord;
  vec2 id;
  
  if (ma < mb)
  {
    bord = fa;
    id = floor((_uv + 0.5 * hexGrid) / hexGrid);
  }
  else
  {
    bord = fb;
    id = floor(_uv/hexGrid) + vec2(123., 273.);
  }
  
  res.x = min(ma, mb);
  res.y = min(1. - bord.x, 1. - bord.y);
  res.zw = id;
  
  return res;
}

vec2 transformUV(in vec2 uv, in float _t, in float _layer)
{
    uv *= (1. + 1.5 * TR(0,_layer) * length(uv));
    vec2 st = uv - 0.2 * (_layer + 1.) * vec2(TR(1,_layer), TR(2,_layer));
    uv.xy = ROT2D(st, TR(3,_layer));

    float alpha = atan(abs(uv.y), uv.x);
    float rad = length(uv);
    vec2 angUv = vec2(alpha, rad);
    vec2 angUv2 = vec2(atan(abs(angUv.y), angUv.x), length(angUv));
    vec2 angUv3 = vec2(atan(angUv2.y, angUv2.x), length(angUv2));
    vec2 angUv4 = vec2(atan(angUv3.y, angUv3.x), length(angUv3));

    vec2 uva = mix(angUv, angUv2, TR(4, _layer));
    vec2 uvb = mix(angUv3, angUv3, TR(5, _layer));

    uv = mix(uva, uvb, TR(6, _layer));
    
    return uv * GRID_SIZE;
}

float filteredRadialLines(in vec2 uv, in float time, float invRes)
{
    vec2 uvh = transformUV(uv + vec2(1.25, 1.25)*invRes, time, 0.) + vec2(0.5) + vec2(0., TR(13,0));
    vec2 uvl = transformUV(uv + vec2(-1.25, 1.25)*invRes, time, 0.) + vec2(0.5) + vec2(0., TR(13,0));
    vec2 uvr = transformUV(uv + vec2(1.25, -1.25)*invRes, time, 0.) + vec2(0.5) + vec2(0., TR(13,0));
    vec2 uvd = transformUV(uv + vec2(-1.25, -1.25)*invRes, time, 0.) + vec2(0.5) + vec2(0., TR(13,0));

    float yh = radialLine(uvh);
    float yl = radialLine(uvl);
    float yr = radialLine(uvr);
    float yd = radialLine(uvd);

    return 0.25 * (yh + yl + yr + yd);
}

vec4 angularLayer(in vec2 uv, in vec2 grid, in float layer, float invRes, float radline)
{ 
    vec2 igrid = floor(grid);
    vec2 fgrid = fract(grid);
    float gid = abs(igrid.x * 1000. + igrid.y);
    
    float margin = TR(7, layer);
    
    vec3 inside = smbox(vec2(margin), vec2(1. - margin), margin, fgrid);
    
    // analytical derivatives.
    float dx = DRV(fgrid.x, margin);
    float dy = DRV(fgrid.y, margin);
    vec3 grad = normalize(vec3(dx, dy, iResolution.y * length(grid)));
    
    // numerical derivatives (not used).
    //vec3 grad = normalize(vec3(dFdx(inside.x), dFdy(inside.y), 2.));
    
    // beat
    float id_beat_cf = hash(gid);
    vec4 beat = TF(mod(gid * 13., SOUND_BINS), TEX_SOUND);
    // base to treble
    vec4 bf;
    bf.x = (1. + TR(20, layer)) * PULSE_T(id_beat_cf, 0.1, 0.01, 0.25);
    bf.y = PULSE_T(id_beat_cf, 0.1, 0.25, 0.5);
    bf.z = PULSE_T(id_beat_cf, 0.1, 0.5, 0.75);
    bf.w = PULSE_T(id_beat_cf, 0.1, 0.75, 0.95);
    
    float border = 1. - (1. + noise(fgrid.x*20.)) * inside.z;

    vec2 roadGrid = grid + vec2(0.5);
    roadGrid.y += TR(13,layer);
    vec2 iroadGrid = floor(roadGrid);
    vec2 froadGrid = fract(roadGrid);
    int rrID = int(iroadGrid.x);
    float flowCf = ASYM_PULSE_T(mod(roadGrid.y + iroadGrid.x, 15.), 0.2, 2.5, 0.2, 2.6);
    float roadMargin = 0.05 * (1. + 0.3 * flowCf);
    float yroad = radline;
    float shRoad = (1. + 0.2 * flowCf) * ANIM_T(froadGrid.x, roadMargin*3., 0.5);

    ///
    float attenuation = floor(max(grid.x, grid.y));
    
    float attCf = 1./(1. + invRes * attenuation * attenuation);
    float intensity;
    float spec;
    for (int il = 0; il < 4; il++)
    {
      vec4 light = TF(il, TEX_LIGHT);
      vec3 pl = normalize(light.xyz - vec3(uv, 0.));
      float f = clamp(abs(dot(pl, grad)), 0., 1.);
      intensity += light.w * f * attCf;
      spec += light.w * clamp(dot(normalize(-reflect(pl, grad)), (vec3(TR(8,layer), TR(9,layer), -3.))), 0., 1.);
    }
    
    float ns = TR(10,layer);
    int palette = GET_PALETTE(TR(14, layer));
    vec3 col = CLT(gid, ns, TEX_GRID_COL + palette);
    
    if (layer < 0.5)
    {
        // AA
        // Smoothing raw color, before lighting.
        float im = 0.05;
        float flow = clamp((fgrid.y - im) / im, 0., 1.);
        float fhigh = clamp((fgrid.y - (1. - im)) / im, 0., 1.);
        vec3 colH = CLT(gid + 1., ns, TEX_GRID_COL + palette);
        vec3 colL = CLT(gid - 1., ns, TEX_GRID_COL + palette);
        col = mix(col, colH, 0.5 * fhigh);
        col = mix(colL, col, 0.5 + 0.5 * flow);
    }
    
    vec4 road_beat = TF(rrID * 6 + 70, TEX_SOUND);
    yroad *= (1. + road_beat[rrID % N_RAD_COLS]);
    
    col *= (1. + 1. * (inside.z) * dot(bf, beat));
    // shadow y - angular sections
    col -= TR(11,layer) * mod(igrid.x, 2.);
    // waves
    col *= (1. - border) + border * (0.75 * col);
     // x - radial shadow lines.
    col = mix(col, (shRoad) * col, shRoad * shRoad * (1. - 0.5 * TR(12,layer)));
    
    // x - radial colored lines.
    col = mix(col, yroad * (1. + 0.5*flowCf) * TF(rrID % N_RAD_COLS, TEX_RAD_COLS).rgb, yroad);
    // lighting.
    col = intensity*col + spec * vec3(0.97, 0.87, 0.65);
    
    // 
    //col = 0.5 * grad + 0.5;
    
    return vec4(col, yroad);
}

const float pi_deg = 3.141592 / 180.0;
mat2 rotationMatrix(float angle)
{
	angle *= pi_deg;
    float s=sin(angle), c=cos(angle);
    return mat2(c, -s, s, c);
}

void main()
{
    vec2 uv = (2.*fragCoord - iResolution.xy)/iResolution.y;
    uv *= rotationMatrix(time * 24.0 * (randomrun - 0.5) + (4.0 * sign(randomrun - 0.5)));

    float invRes = 1./iResolution.y;
    
    vec4 fcol;
    float t = iTime;
    
    vec2 grid0 = transformUV(uv, t, 0.);
    vec2 grid1 = transformUV(uv, t - 3., 1.);
    vec2 grid2 = transformUV(uv, t - 6., 2.);
   
    // AA - filtered radial lines
    // for layer 0 using 4 samples to draw the radial lines.
    float rdl0 = filteredRadialLines(uv, t, invRes);
    float rdl1 = radialLine((grid1 + 0.5));
    float rdl2 = radialLine((grid2 + 0.5));
    
    vec4 c0 = angularLayer(uv, grid0, 0., invRes, rdl0);
    vec4 c1 = angularLayer(uv, grid1, 1., invRes, rdl1);
    vec4 c2 = angularLayer(uv, grid2, 2., invRes, rdl2);
    
    float f1 = TR(0, TEX_FRAME_CONSTS);
    float f2 = TR(1, TEX_FRAME_CONSTS);
    
    fcol = c0;
    fcol = mix(fcol, c1, 0.2 * f1);
    fcol = mix(fcol, c2, 0.2 * f2);
    
    fcol.rgb = pow(fcol.rgb, vec3(2.2));
    
    fragColor = vec4(fcol);
}
