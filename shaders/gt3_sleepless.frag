#version 320 es
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D sound;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iMouse vec2(0.5)

#define H(a) (cos(radians(vec3(30, 90, 120))-((a)*6.2832))*.5+.5) // hue palette
#define RT(a) mat2(cos(m.a*1.571+vec4(0,-1.571,1.571,0))) // rotate

float grid(float x)
{
    float l = max(0., 1.-(abs(fract(x+.5)-.5)/fwidth(x)/1.5)), // lines
          g = 1.-abs(sin(x*3.1416)), // glow
          d = min(1., 1./abs(x)); // darken
    return (l+g*.3+.1)*sqrt(d);
}

//void mainImage( out vec4 C, in vec2 U )  LOL WTF
void main()
{
    vec3  c = vec3(0), u, g;
    vec2  m = iMouse.xy / resolution * 4. - 2.,
          uv = (fragCoord - 0.5 * resolution) / resolution.y;
    float t = iTime/5.,
          tr = smoothstep(0., 1., sin(t)*.6+.5), // transform ratio
          s = 10., // scale
          j = .01; // increment
    
    // audio-reactivity
    float audioLevel = texture(sound, vec2(0.5, 0.5)).g;
    s *= 1.0 + audioLevel * 0.5;
    j *= 1.0 + audioLevel * 10.0;
    
    mat2  pitch = RT(y),
          yaw = RT(x);
    for (float i = j; i < 1.; i+=j)
    {
        u = normalize(vec3(uv, .7*sqrt(i)))*s; // 3d coords
        u.yz *= pitch;
        u.xz *= yaw;
        g = sin(u*6.3)*.5+.6;
        g = vec3(g.x*g.y*g.z);
        u = u*(1.-tr)+g*tr; // transform
        c += grid(u.y-sin(u.x+t))*j*i*H(i)*10.*(1.4-tr);
    }
    c += c*vec3(.1, .7, .9)*tr*c*2.; // some more color
    fragColor = vec4(c*c*1.5, 1);
}
