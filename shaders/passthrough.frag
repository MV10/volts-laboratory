#version 450
precision highp float;

// When a primarily fragment-shader-oriented multipass visualization
// has a vertex-shader pass, specify this as the frag shader for the
// pass to simply output the vert shader results unchanged. Identical
// to Monkey Hi Hat's internal passthrough shader.

in vec4 v_color;
out vec4 fragColor;  
  
void main()
{
    fragColor = v_color;
}
