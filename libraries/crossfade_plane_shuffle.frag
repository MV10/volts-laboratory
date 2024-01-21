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

const float stack_rotate_time = 0.2;
const float stack_lift_time = 0.1;
const float stack_shuffle_time = 0.1;
const float stack_rotate = 0.385;
const float stack_lift_amount = 0.65;

vec4 rotate_shuffle(vec4 result, float rtime, vec2 uv) 
{
    // The amount to pull it back before rotating the next plane in
    float amt = stack_rotate_time;
    float lift = stack_lift_time;
    float shift = stack_shuffle_time;
    
    float rot_amt = stack_rotate;
    float lift_y = stack_lift_amount;
    
    float period = amt * 2.0 + shift + lift * 2.0;
    
    float t0 = mod(rtime * 2.0, period * 2.0);
    float t = mod(t0, period);
    
    // Scene 1 rotation
    float rot = ((min(t, amt) / amt) * rot_amt) * step(t, amt + lift * 2.0 + shift);
    rot += max(0.0, (amt - (t - amt - lift * 2.0 - shift)) / amt * rot_amt) * step(amt + lift * 2.0 + shift, t);
    
    t -= amt;
    
    // Lifting
    float lift1 = step(0.0, t) * (min(t, lift) / lift * lift_y);
    
    // Shift time
    float t2 = t - lift;
    
    // (Working ahead... putting it back down)
    float t3 = t - lift - shift;
    vec2 pos = vec2(0.5, 0.5);
    pos.x += step(0.0, t2) * (min(t2, shift) / shift * 0.05);
    pos.y += step(0.0, t2) * (min(t2, shift) / shift * 0.05);
    lift1 -= step(0.0, t3) * (min(t3, lift) / lift * lift_y);
    vec2 size = vec2(1.0 - rot, 1.0 - rot) * (1.0 - step(0.0, t2) * (min(t2, shift) / shift * 0.1));
    vec4 first = box(oldBuffer, pos, size, uv, rot, lift1) * step(t0, period);
    first += box(newBuffer, pos, size, uv, rot, lift1) * step(period, t0);
    
    t -= lift;
    float swapped = t;
    
    // Scene 2 rotation
    pos = vec2(0.5, 0.5);
    pos.x += 0.05 - step(0.0, t) * (min(t, shift) / shift * 0.05);
    pos.y += 0.05 - step(0.0, t) * (min(t, shift) / shift * 0.05);
    size = vec2(1.0 - rot, 1.0 - rot) * (0.9 + step(0.0, t) * (min(t, shift) / shift * 0.1));
    vec4 second = box(newBuffer, pos, size, uv, rot, 0.0) * step(t0, period);
    second += box(oldBuffer, pos, size, uv, rot, 0.0) * step(period, t0);
    
    // Form the result    
    // Position first over second if rotation is in an early position
    result = result * (1.0 - min(first.a + second.a, 1.0));
    result += (first + second * (1.0 - first.a)) * step(swapped, 0.0);
    
    // Position second over first if rotation is in a later position
    result += (second + first * (1.0 - second.a)) * step(0.0, swapped);
        
    return result;
}

void main()
{
    vec4 result = vec4(0.5 + 0.5 * cos(time + uv.xyx + vec3(0, 2, 4)), 1.0);
    
    // Scale time to match the target duration
    float scaled_time = time * (0.352 / fadeDuration);
    fragColor = rotate_shuffle(result, scaled_time, uv);
}
