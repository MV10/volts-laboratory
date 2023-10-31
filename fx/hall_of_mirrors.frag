#version 460
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D input0;
uniform float random_number_of_images;
uniform float randomrun;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iTime time
#define iChannel0 input0
#define iResolution resolution

// Faithful remake of the deleted "Hall of Mirrors" effect by Red Giant
// Recreated by MysteryPancake

void main() {

    // mcguirev10 - randomized layer transparency
    float vignette_strength = randomrun + 0.75;

	// mcguirev10 - border attenuation (https://www.shadertoy.com/view/cscBDM)
	// 0.1 = small center, 0.9 = nearly no border
	float center_size = 0.3; 
	
	// Number of images to display (mcguirev10 - randomized)
	int images = int(random_number_of_images); //33;
	
	// Scale factor per image
	float scale = 0.9 + cos(iTime * 2.0) * 0.1;
	
	// Rotation per image in degrees
	float rotation = sin(iTime * 0.5) * 45.0;
	
	// Position offset per image in normalized coordinates (0-1)
	//vec2 offset = iMouse.z > 0.0 ? vec2(iMouse.xy / iResolution.xy) : 0.5 + vec2(cos(iTime), sin(iTime)) * 0.5;
	vec2 offset = 0.5 + vec2(cos(iTime), sin(iTime)) * 0.5;

	float rad = radians(-rotation);
	vec2 uv = fragCoord / iResolution.xy;
	fragColor = vec4(0.0);

	for (int i = 0; i < images; ++i) {

		// SCALING: Offset, apply scale, reset offset
		vec2 pos = uv - offset;
		pos /= pow(scale, float(i));
		pos += offset;

		// ROTATION
		float theta = rad * float(i);
		float cs = cos(theta);
		float sn = sin(theta);

		// Offset to center, fix aspect ratio
		pos -= vec2(0.5);
		pos *= iResolution.xy;
		
		// Rotate coordinate space
		pos = vec2(pos.x * cs - pos.y * sn, pos.x * sn + pos.y * cs);
		
		// Reset aspect ratio, reset offset
		pos /= iResolution.xy;
		pos += vec2(0.5);

		// Prevent out of bounds bugs, could also be done with clamp
		if (pos.x >= 0.0 && pos.x <= 1.0 && pos.y >= 0.0 && pos.y <= 1.0) {
			vec4 color = texture(iChannel0, pos);

			// mcguirev10 - quality improvements
			if(i > 0)
			{
				// https://www.shadertoy.com/view/cscBDM

				// border attenuation (still not hiding the hard edges...)
				//vec2 fade_coords = 1.0 - smoothstep(vec2(center_size), vec2(1.0), abs(2.0 * uv - 1.0));
				//float fade_factor = fade_coords.x * fade_coords.y;
				//color = mix(vec4(0), color, fade_factor);

				// override randomization for testing (0.75 to 1.75 is possible)
				//vignette_strength = 1.75; 

				// add a mild vignette which lets the layers mix a little
				float center_distance = sqrt(dot(uv - 0.5, uv - 0.5));
				color = mix(color, vec4(0), center_distance * vignette_strength);
			}
            
			// Alpha blending, see shadertoy.com/view/msSGDm for working example
			fragColor = color + (1.0 - color.a) * fragColor;
		}
	}
}
