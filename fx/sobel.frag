#version 450
precision highp float;

in vec2 fragCoord;
uniform float time;
uniform vec2 resolution;
uniform sampler2D input0;
out vec4 fragColor;

void main()
{
    vec2 uv = fragCoord;
    vec2 d = 1.0 / resolution;

    vec3 c = texture(input0, uv).xyz;
    vec3 u = (
           -1.0 * texture(input0, uv + vec2(-d.x, -d.y)).xyz +
           -2.0 * texture(input0, uv + vec2(-d.x,  0.0)).xyz + 
           -1.0 * texture(input0, uv + vec2(-d.x,  d.y)).xyz +
           +1.0 * texture(input0, uv + vec2( d.x, -d.y)).xyz +
           +2.0 * texture(input0, uv + vec2( d.x,  0.0)).xyz + 
           +1.0 * texture(input0, uv + vec2( d.x,  d.y)).xyz
           ) / 4.0;

    vec3 v = (
           -1.0 * texture(input0, uv + vec2(-d.x, -d.y)).xyz + 
           -2.0 * texture(input0, uv + vec2( 0.0, -d.y)).xyz + 
           -1.0 * texture(input0, uv + vec2( d.x, -d.y)).xyz +
           +1.0 * texture(input0, uv + vec2(-d.x,  d.y)).xyz +
           +2.0 * texture(input0, uv + vec2( 0.0,  d.y)).xyz + 
           +1.0 * texture(input0, uv + vec2( d.x,  d.y)).xyz
           ) / 4.0;

    vec3 color = vec3(sqrt(dot(u, u) + dot(v, v))) * 3.0;

    // vary color by time
    color *= 0.5 + 0.5*cos(time + uv.xyx + vec3(0,2,4));

    fragColor.rgb = color;
}

