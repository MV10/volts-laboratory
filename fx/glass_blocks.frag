#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float frame;
uniform sampler2D input0;
uniform sampler2D inputB;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel0 inputB
#define iChannel1 input0
#define iResolution resolution
int iFrame = int(frame);

const int scale = 32;

void main() {
    int modFrame = iFrame % scale;
    vec2 uv = fragCoord / iResolution.xy;
    if (int(fragCoord.x) % scale == modFrame || int(fragCoord.y) % scale == modFrame) {
        fragColor = texture(iChannel1, uv);
    } else {
        fragColor = texture(iChannel0, uv);
    }
}
