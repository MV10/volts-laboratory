#version 450
precision highp float;

in vec2 fragCoord;
uniform sampler2D input0;
uniform sampler2D input2;
out vec4 fragColor;

// mcguirev10 - added this to keep the base viz "running" in the black areas

void main() 
{
    fragColor = texture(input2, fragCoord);
    if(fragColor.rgb == vec3(0,0,0)) fragColor = texture(input0, fragCoord);
}
