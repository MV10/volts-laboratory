#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution

float saturate(float value) { return max(0., min(value, 1.)); }
vec4 saturate(vec4 value) { return max(vec4(0), min(value, vec4(1))); }

vec4 col(vec2 uv) 
{
  // mcguirev10
  float fft = texture(eyecandyShadertoy, vec2(0.07, 0.25)).g;
  float iTime = time + (fft - 0.45) * 0.75;

  // float t = sin(iTime * 0.17 + length(uv) * 3.0)*2.0;
  float t = sin(iTime * 0.17/2.0 + length(uv) * sin(iTime * 0.5) * 3.0)*4.0;
  uv *=  2.5 + cos(iTime * 1.0) * 1.0;
  uv *= 2.0;
  uv = vec2(cos(t)*uv.x - sin(t) * uv.y, sin(t) * uv.x + cos(t) * uv.y);
  float r = 0.3 + sin(iTime*2.0)*0.01;
  float len = 0.;
  float guv = saturate(1.0 - length(uv * (sin(iTime)) / 2.5));
  guv = pow(guv, 0.7);
  for(float i = 0.; i < 4.0; i++) {
    uv = fract(uv* (sin(iTime * 0.12) * 0.5 + 1.5));
    uv.x -= 0.5;
    uv.y -= 0.5;
    uv *= guv;
    float l = fract(length(uv * 3.0) + iTime*0.5);
    float f = smoothstep(0.5 - r, 0.5, l) - smoothstep(0.5, 0.5 + r, l);
    len += f/3.0;
  }

  vec3 c1 = vec3(0.9, 1.0, 0.0);
  vec3 c2 = vec3(0.0, 0.9, 0.9);
  vec3 c3 = vec3(1.0, 0.9, 1.0);

  vec3 c = mix(c1, c2, abs(sin(length(( uv * 3.0)) + iTime * 3.0)));

  float k = smoothstep(0.8, 1.0, len);
  vec3 color = mix(vec3(len/2.0) * c, c3, k);
  return saturate(color.xyzx) * pow(guv, 0.1);
}

void main()
{
  // mcguirev10 - looks better with fragCoord, and oddly, gl_FragCoord causes eyecandy to log an error:
  // Program stage "eyecandy.AudioTextureWaveHistory.GenerateTexture": InvalidValue
  //vec2 cFrag = gl_FragCoord.xy;
  vec2 cFrag = fragCoord.xy;

  cFrag.y = iResolution.y - cFrag.y;
  vec2 uv = cFrag / iResolution.x;
  uv -= vec2(0.5, 0.5 * iResolution.y/iResolution.x);
  uv/=0.5;

  vec2 uv2 = uv - normalize(uv)*0.025;
  vec2 uv3 = uv - normalize(uv)*0.050;

  vec4 c1 = col(uv);
  vec4 c2 = col(uv2);
  vec4 c3 = col(uv3);
  float k = pow(length(uv), 0.0);
  float r1 = c2.r * k;
  float r2 = c3.r * k;
  fragColor = c1 + vec4(r1, 0.0, r2, 0.0);
  fragColor -= pow(length(uv), 9.0)*0.2;
  fragColor = saturate(fragColor);
  fragColor.x= pow(fragColor.x, 0.9);
  fragColor.y= pow(fragColor.y, 0.9);
  fragColor.z= pow(fragColor.z, 0.9);
}
