#version 450
precision highp float;

in vec2 fragCoord;
uniform sampler2D imageA;
uniform float time;
uniform vec2 resolution;
out vec4 fragColor;

const float PAN_DURATION = 60.0;
const float VERTICAL_ZOOM = 1.05;
const float VERTICAL_WANDER_RELATIVE = 0.75;
const float VERTICAL_WANDER_SPEED = 0.7;

void main()
{
    vec2 uv = fragCoord;

    float displayAspect = resolution.x / resolution.y;

    float panSpeed = 1.0 / PAN_DURATION;
    float horizontalOffset = fract(time * panSpeed);

    float wanderPhase = time * 0.4;
    float verticalOffset;

    ivec2 texSize = textureSize(imageA, 0);
    float texAspect = float(texSize.x) / float(texSize.y);

    float visibleHeight = 1.0 / VERTICAL_ZOOM;
    float scaleY = visibleHeight;
    float scaleX = visibleHeight * displayAspect / texAspect;

    float maxVerticalOffset = (1.0 - visibleHeight) * 0.5;
    verticalOffset = sin(wanderPhase * VERTICAL_WANDER_SPEED) * maxVerticalOffset * VERTICAL_WANDER_RELATIVE;

    vec2 texCoord;
    texCoord.x = horizontalOffset + (uv.x - 0.5) * scaleX;
    texCoord.y = 0.5 + verticalOffset + (uv.y - 0.5) * scaleY;

    texCoord.x = fract(texCoord.x);
    texCoord.y = clamp(texCoord.y, 0.0, 1.0);

    fragColor = texture(imageA, texCoord);
}