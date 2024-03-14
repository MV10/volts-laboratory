#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return a + b * sin(6.28318 * (tan(c) * sin(t) + tan(d)));
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
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

    // mcguirev10 - add rotation for fun and profit
    uv *= rotationMatrix(time * 24.0 * (randomrun - 0.5) + (4.0 * sign(randomrun - 0.5)));

    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 13.0; i++) {
        
        uv = fract(atan(uv) * 1.2) - .5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i * 0.004 + iTime * 0.004);

        d = sin(d * 12.0 + iTime * i) / 14.0;
        d = abs(d);

        d = pow(0.002 / d, .9);

        finalColor += col * d;
    }

    // Apply audio-reactivity
    //float audioLevel = texture(iChannel1, vec2(0.5)).r;  // Fetch audio level from iChannel1
    // mcguirev10 - better reactivity settings
    float audioLevel = texture(eyecandyShadertoy, vec2(0.07, 0.25)).g;  // Fetch audio level from iChannel1
    finalColor *= audioLevel;

    // Enhance psychedelic colors
    finalColor = pow(finalColor, vec3(1.2, 1.5, 1.8));

    // Enhance kaleidoscope effect
    finalColor *= pow(3.5, abs(sin(iTime)));

    fragColor = vec4(finalColor, 1.0);
}
