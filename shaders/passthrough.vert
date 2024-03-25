#version 450

// When a primarily vertex-shader-oriented multipass visualization
// has a fragment-shader pass, specify this as the vert shader for the
// pass to simply output full-coverage vert shader results unchanged.
// Identical to Monkey Hi Hat's internal passthrough shader.

layout(location = 0) in vec3 vertices;
layout(location = 1) in vec2 vertexTexCoords;
out vec2 fragCoord;

void main(void)
{
    fragCoord = vertexTexCoords;
    gl_Position = vec4(vertices, 1.0);
}
