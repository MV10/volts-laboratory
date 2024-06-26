#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform sampler2D input1;
uniform sampler2D input2;
uniform sampler2D input3;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0
#define iChannel1 input1
#define iChannel2 input2
#define iChannel3 input3

//float drawLogo()
//{
//    float val = 0.0;
//    float res = max(iResolution.x, iResolution.y) * 0.75;
//    vec2  pos = vec2(floor((fragCoord.xy / res) * 128.0));
//
//    // AND'16 bitmap
//    val = pos.y == 2.0 ? 4873775.5 : val;
//    val = pos.y == 3.0 ? 8049193.5 : val;
//    val = pos.y == 4.0 ? 2839727.5 : val;
//    val = pos.y == 5.0 ? 1726632.5 : val;
//    val = pos.x >168.0 ? 0.0 : val;
//
//    float bit = floor(val * exp2(pos.x - 168.0));
//
//    return bit != floor(bit / 2.0) * 2.0 ? 1.0 : 0.0;
//}

void main()
{
    vec2 texRes0 = textureSize(iChannel0, 0);
    vec2 texRes1 = textureSize(iChannel1, 0);
    vec2 texRes2 = textureSize(iChannel2, 0);
    vec2 texRes3 = textureSize(iChannel3, 0);

    // Read base mask and slightly offset one for fringing and aberrations.
    vec4 base_clr = texture(iChannel0, fragCoord / texRes0);
    vec4 offs_clr = texture(iChannel0, (fragCoord + (1.5 * texRes0.y / 1600.0)) / texRes0);

    fragColor.rgb = base_clr.ggg;

    // Offset green channel.
    fragColor.g = mix(fragColor.g, offs_clr.g, 0.5);
    fragColor *= 1.6;

    // Add base level noise.
    fragColor.rgb += 0.007 * vec3(base_clr.a, offs_clr.a, base_clr.a);

    // Apply bloom.
    float level1 = texture(iChannel1, (fragCoord +  1.5) / ( 4.0 * texRes1)).y;
    float level2 = texture(iChannel2, (fragCoord +  7.5) / (16.0 * texRes2)).y;
    float level3 = texture(iChannel3, (fragCoord + 31.5) / (64.0 * texRes3)).y;

    fragColor.rgb += 0.2 * vec3(level1 + level2 + level3);

    // Add some foggy medium.
    fragColor.rgb = mix(fragColor.rgb, vec3(level3 * 4.0), 0.07);
    fragColor.rgb = mix(fragColor.rgb, vec3(level2 * 4.0), 0.03);
    fragColor *= 0.5;

    // Colorize image by cycling rgb gammas.
    float t = 4.0 + iTime * 0.15;
    vec3  gamma = 2.4 + vec3(1.3 * sin(t), 1.0 * sin(t * 2.0 + 0.75), 1.3 * sin(t + 3.0));

    fragColor.r = pow(fragColor.r, gamma.r);
    fragColor.g = pow(fragColor.g, gamma.g);
    fragColor.b = pow(fragColor.b, gamma.b);

    // Normalize luminance.
    vec3  mag = vec3(pow(0.25, gamma.r), pow(0.25, gamma.g), pow(0.25, gamma.b));
    float luma = dot(mag, vec3(0.333));
    fragColor.rgb /= 10.0 * luma;

    // Darken the edges for aesthetics.
    vec2 mtc = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    mtc *= vec2(2.0, 0.2);
    mtc.xy -= 0.04 * normalize(mtc) * pow(length(mtc), 3.0);
    mtc /= vec2(2.0, 0.2);
    
    vec2  ouv = 1.01 * 1.25 * mtc;
    float wx = max(0.0, 1.5 - 2.0 * clamp(abs(ouv.x) - 0.5, 0.0, 1.0));
    float wy = max(0.0, 1.0 - 3.0 * clamp(abs(ouv.y) - 0.5, 0.0, 1.0));

    fragColor.rgb *= wx * wy;

    // Add logo when side screen are on.
    //fragColor.rgb += 0.1 * mag * drawLogo() *
    //    (1.0 - clamp((sin((iTime + 10.0) / 9.6) - 0.5) * 10.0, 0.0, 1.0));

    // Apply anamorphic flare.
    float flare = base_clr.z;
    flare += texture(iChannel1, fragCoord / (vec2( 4, 1) * texRes1)).z;
    flare += texture(iChannel2, fragCoord / (vec2(16, 1) * texRes2)).z;
    flare += texture(iChannel3, fragCoord / (vec2(64, 1) * texRes3)).z;
    fragColor.rgb += flare * vec3(0.05, 0.2, 5.0) * 8e-4;

    // Compress dynamic range.
    fragColor.rgb *= 5.0;
    fragColor.rgb = 1.5 * fragColor.rgb / (1.0 + fragColor.rgb);

    // Linear to sRGB.
    fragColor.rgb = sqrt(fragColor.rgb);

    // Add additional nonlinearities to shadows and highlights.
    vec3 sclr = smoothstep(0.0, 1.0, fragColor.rgb);

    fragColor.r = mix(fragColor.r, sclr.r, 0.6);
    fragColor.g = mix(fragColor.g, sclr.g, 0.8);
    fragColor.b = mix(fragColor.b, sclr.b, 1.0);
}
