#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform float randomrun;
uniform sampler2D input0;
out vec4 fragColor;

// grayscale_factor 0.0 uses hue_jazz-style hue-shifting instead
// grayscale_factor 1.0 is 100% desaturation in the detail copies
uniform float grayscale_factor = 0.0;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iTime time
#define iChannel0 input0

vec4 desaturate(vec3 rgb, float factor);
vec3 rgb2hsv(vec3 c);
vec3 hsv2rgb(vec3 c);

#define PI 3.141592
mat2 rotationMatrix(float angle)
{
	angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2(c, -s, s, c);
}

void main()
{
    vec2 uv = fragCoord.xy / iResolution.y;

    // mcguirev10 -- as always, rotation is cooler; yields a time multiplier of -6.0 to +6.0
    uv *= rotationMatrix(iTime * (2.0 + (8.0 * (randomrun - 0.5))));

    vec2 c = vec2(-0.74441,0.18631) + 3.0 * (uv - 0.5) * pow(0.01, 1.0 - cos(0.2 * iTime));
    vec2 z = vec2(0.0);
    for (int i = 0; i < 60; i++)
    {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z,z) > 1e4)
        {
            float tu = mod(atan(z.y, z.x) / 6.283185 + iTime * 0.5, 1.0); 
            float tv = log2(log(dot(z, z)) / log(1e4)); 

            //fragColor = texture(iChannel0, vec2(tu, tv)).rgga * 1.4;

            // account for float inaccuracies (especially bad on AMD)
            if(grayscale_factor < 0.0001)
            {
	            vec3 hsv = rgb2hsv(texture(iChannel0, vec2(tu, tv)).rgb);
	            float hue = hsv.x + abs(sin(time * (randomrun * 0.3)));
	            fragColor = vec4(hsv2rgb(vec3(hue, max(0.5, hsv.y), hsv.z)).rgb, 1.0);
            }
            else
            {
                fragColor = desaturate(texture(iChannel0, vec2(tu, tv)).rgb, grayscale_factor);
            }

            return;
        }
    }

	//fragColor = texture(iChannel0, z + 0.5).brra * 1.3 - 0.25;
    fragColor = texture(iChannel0, z + 0.5);
}
