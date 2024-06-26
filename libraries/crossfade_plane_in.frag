#version 450
precision highp float;

// Adapted from https://www.shadertoy.com/view/DlycWm
// My revisions https://www.shadertoy.com/view/lcfXzj

in vec2 fragCoord;
uniform sampler2D oldBuffer;
uniform sampler2D newBuffer;
out vec4 fragColor;

uniform float fadeDuration;
uniform float time;
#define uv fragCoord

#define PI 3.1415926

const float mirror_intensity = 0.25;

vec4 box(sampler2D tx, vec2 pos, vec2 size, vec2 uv, float rot, float dy) 
{
    float z = 0.25;
    size.x *= abs(rot - 1.0);
    float arot = 1.0 - abs(rot - 1.0);
    float dir = (2.0 * step(rot, 1.0)) - 1.0;
    float amtx = (uv.x - pos.x + size.x / 2.0) / size.x;
    amtx = (abs(step(1.0, rot) - amtx) - 0.5) * 2.0;
    float amty = z * size.y * arot * amtx;
    size.y += amty;
    pos.y += dy + dy * amty * 1.6;
    vec2 uvBox = (uv - pos + size / 2.0) / size;
    vec4 result = vec4(texture(tx, uvBox).rgb, 1.0);
    result *= step(0.0, uvBox.x) * step(uvBox.x, 1.0);
    result *= step(uvBox.y, 1.0) * step(0.0, uvBox.y);
    float d = clamp(size.x + 0.25, 0.0, 1.0);
    result *= vec4(d, d, d, 1.0);
    
    pos.y -= dy * 2.0;
    uvBox = (uv - pos + size / 2.0) / size;
    vec4 mirror = vec4(texture(tx, abs(uvBox)).rgb, 1.0);
    mirror *= step(0.0, uvBox.x) * step(uvBox.x, 1.0);
    mirror *= step(uvBox.y, 0.0) * step(-1.0, uvBox.y);
    uvBox = (1.0 - abs(uvBox));
    mirror *= vec4(uvBox.y, uvBox.y, uvBox.y, 1.0);
    mirror *= vec4(d, d, d, 1.0) * mirror_intensity;
    return result + mirror;
}

vec4 rotate_in(vec4 result, float rtime, vec2 uv) 
{
    rtime *= 0.5;
    
    // The amount to pull it back before rotating the next plane in
    float amt = 0.385;
    float rot = abs(mod(rtime * 2.0, 2.0) - 1.0) * amt * 2.0;
    
    // Scene 1 rotation
    float rot1 = min(rot, amt);
    vec2 pos = vec2(0.5, 0.5);
    pos.x += rot1 / 2.0;
    vec2 size = vec2(1.0 - rot1, 1.0 - rot1);
    vec4 first = box(newBuffer, pos, size, uv, rot1, 0.0);
    
    // Scene 2 rotation
    float rot2 = max(rot + 2.0 * (1.0 - amt), 2.0 - amt);
    pos = vec2(0.5, 0.5);
    pos.x -= (2.0 - rot2) / 2.0;
    size = vec2(abs(1.0 - rot2), abs(1.0 - rot2));
    vec4 second = box(oldBuffer, pos, size, uv, rot2, 0.0);
    
    // Form the result
    result = result * (1.0 - min(first.a + second.a, 1.0));
    
    // Position first over second if rotation is in an early position
    result += (first + second * (1.0 - first.a)) * step(rot, amt);
    
    // Position second over first if rotation is in a later position
    result += (second + first * (1.0 - second.a)) * step(amt, rot);
        
    return result;
}

void main()
{
    vec4 result = vec4(0.5 + 0.5 * cos(time + uv.xyx + vec3(0, 2, 4)), 1.0);
    
    // Scale time to match the target duration
    float scaled_time = time * (1.0 / fadeDuration);
    fragColor = rotate_in(result, scaled_time, uv);
}
