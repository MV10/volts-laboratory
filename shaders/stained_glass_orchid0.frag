#version 450
precision highp float;

in vec2 fragCoord;
uniform vec2 resolution;
uniform float time;
uniform sampler2D inputA;
uniform sampler2D eyecandyShadertoy;
out vec4 fragColor;

#define fragCoord (fragCoord * resolution)
#define iResolution resolution
#define iChannel0 inputA
#define iChannel1 eyecandyShadertoy
#define iTime time

// precompute texture buffer
// mainly reducing compilation time

float hash(in float _x) { return fract(5313.235 * mod(_x, 0.75182) * mod(_x, 0.1242)); }
float noise(in float _x) { float i = floor(_x); float f = fract(_x); return mix(hash(i), hash(i + 1.), 3.*f*f - 2.*f*f*f); }
#define PULSE_T(_t, _e, _pa, _pb) (smoothstep(_pa - _e, _pa, _t) - smoothstep(_pb, _pb + _e, _t))
#define ATR(_aid, _layer, _f) if (coord.x == _aid && coord.y == _layer) { ctrl.r = _f; }
#define ATF(_aid, _layer, _f) if (coord.x == _aid && coord.y == _layer) { ctrl = _f; }
#define LIGHT 4
#define RAD_COLS 5
#define FRAME_CONSTS 6
#define SOUND 7
#define TTIME 10
#define GRID_COL 12
#define GRID_COL2 13
#define GRID_COL3 14
#define GRID_COL4 15

#define SOUND_BIN_SIZE 4.
//const float N_BINS = 512. / SOUND_BIN_SIZE;
// mcguirev10: eyecandy uses 1024 samples
const float N_BINS = 1024. / SOUND_BIN_SIZE;

void main()
{
    vec4 ctrl;
    ivec2 coord = ivec2(fragCoord);
    float t0 = iTime;
    float t1 = iTime - 3.;
    float t2 = iTime - 6.;
    
    for (int layer = 0; layer < 3; layer++)
    {
        float t = layer == 0 ? t0 : layer == 1 ? t1 : t2;
        // transform states
        ATR(0,layer, noise(t * 0.18 + 1.3))
        ATR(1,layer, cos(6.28 * noise(t * 0.1 + 193.)))
        ATR(2,layer, sin(6.28 * noise(t * 0.1 + 35.)))
        ATR(3,layer, noise(t * 0.1 + 17.))
        ATR(4,layer, noise(t * 0.13 + 31.))
        ATR(5,layer, noise(t * 0.21 + 73.))
        ATR(6,layer, noise(t * 0.1 + 23.))
        
        //
        ATR(7,layer, 0.1 + 0.1 * noise(t * 0.25 + 21.))
        ATR(8,layer, noise(t * 0.5 + 3.2))
        ATR(9,layer, noise(t * 0.5 + 4.7))
        ATR(10,layer, noise(t * 0.1))
        ATR(11,layer, noise(t * 0.25 + 321.23) * 0.5)
        ATR(12,layer, 1.5 * PULSE_T(mod(t, 30.), 1.25, 8., 16.))
        ATR(13,layer, 4.*t)
        ATR(14,layer, noise(0.025 * t));
        ATR(15,layer, 10. * PULSE_T(mod(t, 25.), 0.5, 10., 11.))
    }
    
    // constants
    ATF(0,LIGHT, vec4(0., 0., 5., 0.2));
    ATF(1,LIGHT, vec4(0., 0.25, 3., 0.2));
    ATF(2,LIGHT, vec4(-1., -1., 3., 0.2));
    ATF(3,LIGHT, vec4(1., -1., 3., 0.2));
    
    // radial light colors
    // https://www.shutterstock.com/blog/neon-color-palettes #12
    ATF(0,RAD_COLS, vec4(0.808, 0.588, 0.984, 1.));
    ATF(1,RAD_COLS, vec4(1.0, 0.561, 0.812, 1.));
    ATF(2,RAD_COLS, vec4(0.0, 0.761, 0.729, 1.));
    ATF(3,RAD_COLS, vec4(0.012, 0.478, 0.565, 1.));
    
    ATR(0, FRAME_CONSTS, PULSE_T(mod(t0, 60.), 10., 55., 1.));
    ATR(1, FRAME_CONSTS, PULSE_T(mod(t0, 60.), 15., 55., 1.));
    
    // palettes
    // may be set on frame 0 only
    ATF(0, GRID_COL, vec4(1.0, 0.9607843137254902, 0.9215686274509803, 1.0));
    ATF(1, GRID_COL, vec4(0.9977854671280277, 0.9275663206459055, 0.8573471741637831, 1.0));
    ATF(2, GRID_COL, vec4(0.9955709342560554, 0.8907958477508651, 0.7855132641291811, 1.0));
    ATF(3, GRID_COL, vec4(0.9933564013840831, 0.842076124567474, 0.6880738177623991, 1.0));
    ATF(4, GRID_COL, vec4(0.9921568627450981, 0.7769934640522875, 0.5727028066128412, 1.0));
    ATF(5, GRID_COL, vec4(0.9921568627450981, 0.7016993464052288, 0.45090349865436374, 1.0));
    ATF(6, GRID_COL, vec4(0.9921568627450981, 0.6280507497116494, 0.34226835832372166, 1.0));
    ATF(7, GRID_COL, vec4(0.9914186851211073, 0.550726643598616, 0.23277201076509035, 1.0));
    ATF(8, GRID_COL, vec4(0.9648442906574395, 0.47100346020761247, 0.14197616301422528, 1.0));
    ATF(9, GRID_COL, vec4(0.9314417531718571, 0.39298731257208774, 0.06426758938869671, 1.0));
    ATF(10, GRID_COL, vec4(0.8782929642445213, 0.31990772779700116, 0.024405997693194924, 1.0));
    ATF(11, GRID_COL, vec4(0.7898039215686274, 0.26076124567474046, 0.006320645905420991, 1.0));
    ATF(12, GRID_COL, vec4(0.6768627450980392, 0.22089965397923875, 0.010749711649365626, 1.0));
    ATF(13, GRID_COL, vec4(0.5844059976931949, 0.186159169550173, 0.013471741637831602, 1.0));
    ATF(14, GRID_COL, vec4(0.4980392156862745, 0.15294117647058825, 0.01568627450980392, 1.0));
    
    ATF(0, GRID_COL3, vec4(1.0, 0.9607843137254902, 0.9411764705882353, 1.0));
    ATF(1, GRID_COL3, vec4(0.9977854671280277, 0.9142791234140715, 0.8747404844290657, 1.0));
    ATF(2, GRID_COL3, vec4(0.9950634371395617, 0.8596539792387543, 0.7986620530565167, 1.0));
    ATF(3, GRID_COL3, vec4(0.990634371395617, 0.7777162629757786, 0.6901499423298731, 1.0));
    ATF(4, GRID_COL3, vec4(0.9882352941176471, 0.6866743560169165, 0.5778854286812765, 1.0));
    ATF(5, GRID_COL3, vec4(0.9882352941176471, 0.5958785082660515, 0.4738023836985775, 1.0));
    ATF(6, GRID_COL3, vec4(0.9865897731641676, 0.5067281814686659, 0.38123798539023457, 1.0));
    ATF(7, GRID_COL3, vec4(0.9835755478662053, 0.4127950788158401, 0.28835063437139563, 1.0));
    ATF(8, GRID_COL3, vec4(0.9570011534025374, 0.3087120338331411, 0.22191464821222606, 1.0));
    ATF(9, GRID_COL3, vec4(0.9167704728950405, 0.21145713187235693, 0.16401384083044987, 1.0));
    ATF(10, GRID_COL3, vec4(0.8370472895040368, 0.13394848135332565, 0.13079584775086506, 1.0));
    ATF(11, GRID_COL3, vec4(0.7504959630911188, 0.08332179930795848, 0.10412918108419839, 1.0));
    ATF(12, GRID_COL3, vec4(0.6663437139561708, 0.06339100346020761, 0.08641291810841982, 1.0));
    ATF(13, GRID_COL3, vec4(0.5412226066897348, 0.03321799307958477, 0.06869665513264128, 1.0));
    ATF(14, GRID_COL3, vec4(0.403921568627451, 0.0, 0.05098039215686274, 1.0));
    
    ATF(0, GRID_COL2, vec4(0.9686274509803922, 0.984313725490196, 1.0, 1.0));
    ATF(1, GRID_COL2, vec4(0.9132641291810842, 0.9488811995386389, 0.9822837370242214, 1.0));
    ATF(2, GRID_COL2, vec4(0.8584083044982699, 0.9134486735870818, 0.9645674740484429, 1.0));
    ATF(3, GRID_COL2, vec4(0.8052595155709343, 0.8780161476355247, 0.9468512110726643, 1.0));
    ATF(4, GRID_COL2, vec4(0.7309496347558632, 0.8394771241830065, 0.9213225682429834, 1.0));
    ATF(5, GRID_COL2, vec4(0.6423683198769704, 0.8018300653594771, 0.890319108035371, 1.0));
    ATF(6, GRID_COL2, vec4(0.5356862745098039, 0.746082276047674, 0.8642522106881968, 1.0));
    ATF(7, GRID_COL2, vec4(0.41708573625528644, 0.6806305267204922, 0.8382314494425221, 1.0));
    ATF(8, GRID_COL2, vec4(0.32628988850442137, 0.6186236063052672, 0.802798923490965, 1.0));
    ATF(9, GRID_COL2, vec4(0.24004613610149955, 0.5537716262975779, 0.7667973856209152, 1.0));
    ATF(10, GRID_COL2, vec4(0.16696655132641292, 0.48069204152249134, 0.7291503267973857, 1.0));
    ATF(11, GRID_COL2, vec4(0.09942329873125721, 0.4047520184544406, 0.6798154555940024, 1.0));
    ATF(12, GRID_COL2, vec4(0.044059976931949255, 0.3338869665513264, 0.6244521337946944, 1.0));
    ATF(13, GRID_COL2, vec4(0.03137254901960784, 0.2613148788927335, 0.5281199538638985, 1.0));
    ATF(14, GRID_COL2, vec4(0.03137254901960784, 0.18823529411764706, 0.4196078431372549, 1.0));
    
    ATF(0, GRID_COL4, vec4(0.9686274509803922, 0.9882352941176471, 0.9607843137254902, 1.0));
    ATF(1, GRID_COL4, vec4(0.9287658592848904, 0.9727335640138408, 0.9142791234140715, 1.0));
    ATF(2, GRID_COL4, vec4(0.8828143021914648, 0.9546943483275664, 0.8621914648212226, 1.0));
    ATF(3, GRID_COL4, vec4(0.8163783160322953, 0.9281199538638985, 0.7913264129181085, 1.0));
    ATF(4, GRID_COL4, vec4(0.7371472510572856, 0.895517108804306, 0.7108342945021145, 1.0));
    ATF(5, GRID_COL4, vec4(0.6529950019223376, 0.8600845828527489, 0.6288965782391387, 1.0));
    ATF(6, GRID_COL4, vec4(0.5573241061130334, 0.8164244521337947, 0.546958861976163, 1.0));
    ATF(7, GRID_COL4, vec4(0.45176470588235296, 0.7670895809304115, 0.4612072279892349, 1.0));
    ATF(8, GRID_COL4, vec4(0.3388235294117647, 0.7117262591311034, 0.40584390618992694, 1.0));
    ATF(9, GRID_COL4, vec4(0.2378316032295272, 0.6523798539023453, 0.3510495963091119, 1.0));
    ATF(10, GRID_COL4, vec4(0.17139561707035755, 0.581514801999231, 0.2979008073817762, 1.0));
    ATF(11, GRID_COL4, vec4(0.09527104959630911, 0.5091118800461361, 0.24059976931949248, 1.0));
    ATF(12, GRID_COL4, vec4(0.017762399077277974, 0.44267589388696654, 0.18523644752018453, 1.0));
    ATF(13, GRID_COL4, vec4(0.0, 0.3574625144175317, 0.14352941176470588, 1.0));
    ATF(14, GRID_COL4, vec4(0.0, 0.26666666666666666, 0.10588235294117647, 1.0));
    
    // sound
    // change frequency
    const float beat = 1.30434;
    const float cf = beat*0.5; //0.25;  mcguirev10: I think necessary since eyecandy has twice the sample size
    vec4 lt0 = texelFetch(iChannel0, ivec2(0, TTIME), 0);
    vec4 ct;
    ct.x = int(t0 * cf) != int(lt0.x * cf) ? t0 : lt0.x;
    ct.y = int(t0 * 2. * cf) != int(lt0.y * cf) ? t0 : lt0.y;
    ct.z = int(t0 * 4. * cf) != int(lt0.z * cf) ? t0 : lt0.z;
    ct.w = int(t0 * 8. * cf) != int(lt0.w * cf) ? t0 : lt0.w;
    
    ATF(0, TTIME, ct);
    
    if (fragCoord.x < N_BINS)
    {
        vec2 sound;
        
        for (float is = 0.0; is < SOUND_BIN_SIZE; is++)
        {
          sound.x += texture(iChannel1, vec2((fragCoord.x*N_BINS + is)/iResolution.x, 0.0)).g;
          // mcguirev10: never used, and shadertoy y has no data anyway
          //sound.y += texture(iChannel1, vec2((fragCoord.x*N_BINS + is)/iResolution.x, 1.0)).y; 
          sound.y = 0.0;
        }
        
        sound /= SOUND_BIN_SIZE;

        if (coord.y == SOUND) 
        { 
           vec4 lsnd = texture(iChannel0, vec2(fragCoord.xy/iResolution.xy));
           ctrl.x = int(t0 * cf) != int(lt0.x * cf) ? sound.x : 0.9 * lsnd.x;
           ctrl.y = int(t0 * 2. * cf) != int(lt0.y * cf) ? sound.x : 0.9  * lsnd.x;
           ctrl.z = int(t0 * 4. * cf) != int(lt0.z * cf) ? sound.x : 0.85 * lsnd.z;
           ctrl.w = int(t0 * 8. * cf) != int(lt0.w * cf) ? sound.x : 0.8  * lsnd.w;
        }
    }
        
    fragColor = vec4(ctrl);
}