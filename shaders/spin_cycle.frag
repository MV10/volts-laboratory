#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 eyecandyShadertoy
#define iTime time

const float segmentsNumVariants[] = float[](1.0, 3.0, 7.0, 11.0);

void main()
{
    vec2 centerCoord = iResolution.xy / 2.0;

    float normalDist = distance( fragCoord.xy, centerCoord )
                     / ( sqrt( 2.0 * iResolution.x * iResolution.x ) * 1.25);
    float reverseNormalDist = 1.0 - normalDist;
    vec2 normalCoord = normalize( fragCoord.xy - centerCoord );
    
    float sound = texture( iChannel0, vec2( cos( normalDist ), 0.5 )).g 
                + texture( iChannel0, vec2( sin( normalDist ), 0.5 )).g;
                
    float segmentsNum = segmentsNumVariants[ int( floor( sound * 2.0 + normalDist )) ];
                
    float radialWave = 0.5 + cos( atan( normalCoord.x, normalCoord.y ) * segmentsNum + iTime * 3.0 + cos( sound * 10.0 ) * sound );
    
    float shiftedTime = iTime - ( normalDist * 7.0 ) 
                      + radialWave * sin( pow( reverseNormalDist, reverseNormalDist ) * 50.0 + iTime + sound * sound * 2.0 );
    
    float waveModulator = 0.35 + sin( normalDist * 20.0 - shiftedTime * 4.0 ) * sound;
    
    float red = ( 0.25 + cos( shiftedTime + sound * 4.0) / 2.5 ) * waveModulator;
    float green = 0.75 * waveModulator * ( 0.5 + sin(sound * 7.0 ) / 2.0 );
    float blue = ( 0.25 + sin( shiftedTime + sound * 4.0 ) / 2.5 ) * waveModulator;
    
    fragColor = vec4( red, green, blue, 1.0 );
}
