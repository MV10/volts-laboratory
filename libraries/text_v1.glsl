#version 450

/*

Adapted from foodini's "font renderer" at https://www.shadertoy.com/view/cdtBWl

You may wish to use the text_v1a version instead, which assumes the font texture
uniform name and caches the uv value instead of requiring it on every function call.

See testing\shadertoy_pcm.conf and testing\shadertoy_pcm1.frag for an example.

Use "Shadertoy Font 1024x1024.png" as the print functions' sampler2D arguments.

At the bottom of the file are a series of DECL_PRINT_STRING(n) entries where
"n" is the size of the int array representing a character string. Array sizes
of 1 to 12 characters are supported. If you need more, add another declaration.

Origin of the Shadertoy font and to make new ones:
	https://timmaffett.github.io/shadertoy_fontgen/generate_sdf.html
	https://www.shadertoy.com/view/llcXRl
	https://github.com/otaviogood/shader_fontgen
	https://github.com/timmaffett/shader_fontgen

*/

#define DC(name, val) const int name = val

DC(_NULL,127); //I may want as non-null since the font has a character there.

DC(_SPACE,32); DC(_BANG,33); DC(_QUOTE,34); DC(_HASH,35); 
DC(_DOLLAR,36); DC(_PERCENT,37); DC(_AMPERSAND,38); DC(_APOSTROPHE,39); 
DC(_PREN,40); DC(_NERP,41); DC(_STAR,42); DC(_PLUS,43); 
DC(_COMMA,44); DC(_MINUS,45); DC(_PERIOD,46); DC(_SLASH,47);

DC(_0,48); DC(_1,49); DC(_2,50); DC(_3,51);
DC(_4,52); DC(_5,53); DC(_6,54); DC(_7,55);
DC(_8,56); DC(_9,57); DC(_COLON,58); DC(_SEMICOLON,59);
DC(_LFTANGL,60); DC(_EQUAL,61); DC(_RGTANGL,62); DC(_QUESTION,63);

DC(_AT,64); DC(_A,65); DC(_B,66); DC(_C,67); 
DC(_D,68); DC(_E,69); DC(_F,70); DC(_G,71); 
DC(_H,72); DC(_I,73); DC(_J,74); DC(_K,75); 
DC(_L,76); DC(_M,77); DC(_N,78); DC(_O,79); 

DC(_P,80); DC(_Q,81); DC(_R,82); DC(_S,83); 
DC(_T,84); DC(_U,85); DC(_V,86); DC(_W,87); 
DC(_X,88); DC(_Y,89); DC(_Z,90); DC(_LFTSQR,91); 
DC(_BACKSLASH,92); DC(_RGTSQR,93); DC(_CARET,94); DC(_UNDERSCORE,95); 

DC(_GRAVE,96); DC(_a,97); DC(_b,98); DC(_c,99); 
DC(_d,100); DC(_e,101); DC(_f,102); DC(_g,103); 
DC(_h,104); DC(_i,105); DC(_j,106); DC(_k,107); 
DC(_l,108); DC(_m,109); DC(_n,110); DC(_o,111); 

DC(_p,112); DC(_q,113); DC(_r,114); DC(_s,115); 
DC(_t,116); DC(_u,117); DC(_v,118); DC(_w,119); 
DC(_x,120); DC(_y,121); DC(_z,122); DC(_LFTSQUIG,123); 
DC(_PIPE,124); DC(_RGTSQUIG,125); DC(_TILDE,126);

DC(_alpha,128); DC(_beta,129); DC(_gamma,130); DC(_delta,131); 
DC(_epsilon,132); DC(_theta,133); DC(_lambda,134); DC(_mu,135); 
DC(_xi,136); DC(_pi,137); DC(_rho, 138); DC(_sigma,139); 
DC(_tau,140); DC(_phi,141); DC(_psi,142); DC(_omega,143); 

DC(_GAMMA,144); DC(_DELTA,145); DC(_THETA,146); DC(_LAMBDA,147); 
DC(_PI,148); DC(_SIGMA,149); DC(_PHI,150); DC(_PSI,151); 
DC(_OMEGA,152); DC(_INFINITY,153); DC(_FORTE,154); DC(_degrees,155); 
DC(_INTEGRAL, 156); DC(_PARTIAL_DIFF, 157); DC(_NABLA,158); DC(_SQRT, 159); 

                     DC(_GNAB,161); DC(_CENT,162); DC(_POUND,163); 
DC(_VECTOR_OUT,164); DC(_YEN,165); DC(_BROKEN_PIPE,166); DC(_CONTOUR_INTEGRAL,167); 
                     DC(_COPYRIGHT,169); DC(_superscript_a,170); DC(_LEFT_SHIFT,171); 
                                         DC(_REGISTERED,174); DC(_OVERBAR,175); 
                                         
DC(_DEGREES, 176); DC(_PLUSMINUS,177); DC(_superscript2,178); DC(_superscript3,179); 
DC(_ACCENT, 180); DC(_MU,181); DC(_PARAGRAPH,182); DC(_DOT,183);
                  DC(_superscript_1,185); DC(_superscript_0,186); DC(_RIGHT_SHIFT,187); 
DC(_QUARTER,188); DC(_HALF,189); DC(_THREE_QUARTERS,190); DC(_NOITSEUQ,191); 

vec4 print_char(sampler2D font_channel, int c, float size, vec2 char_pos, vec2 uv) {
    //This took me a while to get my brain around: uv and char_pos are in the same
    //vector space. What that space is is irrelevant. It can be fragCoord, a
    //square-pixel uv, a 0->1 by 0->1 uv, a -1->1 by -1->1 uv, or anything else. The
    //only thing that matters is whether uv is within a box "size" units on a side.
    //Check to make sure that uv lies within the extents of the character to be printed:

    //font_uv_offset goes from -1.0->1.0 in both dimensions and is the position 
    //within the rendered character of uv.
    vec2 font_uv_offset = (uv - char_pos) / size;
    
    if(font_uv_offset.x < -1.0 ||
       font_uv_offset.x >  1.0 ||
       font_uv_offset.y < -1.0 ||
       font_uv_offset.y >  1.0) {
        return vec4(0.0);
    }
    
    
    float row = float(15 - c/16);
    float col = float(c%16);
    
    const float half_char_width = 1.0/32.0;
    const float char_width = 1.0/16.0;
    
    vec2 font_uv = 
        vec2(half_char_width + char_width * col, half_char_width + char_width * row); 
    font_uv += font_uv_offset * half_char_width;
    
    return texture(font_channel, font_uv);
}

const float log10 = log(10.0);
int digits(int i) {
    i = abs(i);
    int retval = 0;
    //TODO: this might be faster as a for loop with a break because of the way
    //      for loops are unrolled? It would certainly be faster with a binary
    //      search of ifs.
    do {
        retval++;
        i /= 10;
    } while(i > 0);
    return retval;
}

vec4 print_int(sampler2D font_channel, int i, float size, vec2 pos, vec2 uv, bool right, out int count) {
    vec4 retval = vec4(0.0);
    bool neg = i<0;
    i = abs(i);
    
    if(!right) {
        pos.x += size * (float(digits(i) - 1));
        if(neg) {
            pos.x += size;
        }
    }

    count = 0;
    do {
        int c = 48 + i%10;
        i /= 10;
        retval += print_char(font_channel, c, size, pos, uv);
        pos.x -= size;
        count ++;
    } while(i > 0);

    if(neg) {
        retval += print_char(font_channel, 45, size, pos, uv);
        count++;
    }
    return retval;
}
vec4 print_int(sampler2D font_channel, int i, float size, vec2 pos, vec2 uv, bool right) {
    int _count;
    return print_int(font_channel, i, size, pos, uv, right, _count);
}

vec4 print_float(sampler2D font_channel, float f, float size, vec2 pos, vec2 uv, bool right, int frac_digits, out int count) {
    vec4 retval = vec4(0.0);
    count = 0;
    bool neg = false;

    if(f < 0.0) {
        neg = true;
        f = abs(f);
    }
    
    int frac_int = int(0.001 + fract(f) * pow(10.0, float(frac_digits)));
    int mant_int = int(f);
    
    if(!right) {
        int width = (neg?1:0) + digits(mant_int);
        if(frac_digits > 0) {
            width += 1 + frac_digits;
        }
        pos.x += size * float(width-1);

        //retval += print_int(font_channel, digits(frac_int), size/2.0, pos + vec2(0.0, size), uv, true, tmp); 
    }
    
    
    if(frac_digits > 0) {
        retval += print_int(font_channel, frac_int, size, pos, uv, true, count);
        pos.x -= size * float(count);
        while(count < frac_digits) {
            retval += print_char(font_channel, 48, size, pos, uv);
            pos.x -= size;
            count ++;
        }
        retval += print_char(font_channel, 46, size, pos, uv);
        pos.x -= size;
    }
    int printed;
    retval += print_int(font_channel, mant_int, size, pos, uv, true, printed);
    count += printed;
    if(neg) {
        pos.x -= size * float(printed);
        retval += print_char(font_channel, 45, size, pos, uv);
        count ++;
    }
   
    return retval;
}

vec4 print_float(sampler2D font_channel, float f, float size, vec2 pos, vec2 uv, bool right, int frac_digits) {
    int _count;
    return print_float(font_channel, f, size, pos, uv, right, frac_digits, _count);
}

float accumulating_left;
vec2 accumulating_pos;
float accumulating_size;
void init_printing(vec2 pos, float size) {
    accumulating_pos = pos;
    accumulating_left = pos.x;
    accumulating_size = size;
}

void newline() {
    accumulating_pos.x = accumulating_left;
    accumulating_pos.y -= accumulating_size*1.5;
}

const float tab_width = 8.0;
void tab() {
    float x = accumulating_pos.x;
    float printed = (x-accumulating_left)/accumulating_size;
    float dx = tab_width - mod(printed, tab_width);
    accumulating_pos.x += accumulating_size * dx;
}

vec4 print(sampler2D font_channel, int i, vec2 uv) {
    int printed;
    vec4 retval;
    retval = print_int(font_channel, i, accumulating_size, accumulating_pos, uv, false, printed);
    accumulating_pos.x += float(printed) * accumulating_size;
    
    return retval;
}

vec4 print(sampler2D font_channel, float f, vec2 uv, int frac_digits) {
    int printed;
    vec4 retval;
    //return print_float(font_channel, f, size, pos, uv, right, frac_digits, _count);
    retval = print_float(font_channel, f, accumulating_size, accumulating_pos, 
                         uv, false, frac_digits, printed);
    accumulating_pos.x += float(printed+1) * accumulating_size;
    
    return retval;
}

#define DECL_PRINT_STRING(len) \
vec4 print(sampler2D font_channel, int c[len], vec2 uv) { \
    vec4 retval; \
    for(int i=0; i<len; i++) { \
        retval += print_char(font_channel, c[i], accumulating_size, accumulating_pos, uv); \
        accumulating_pos.x += accumulating_size; \
    } \
    return retval; \
}

DECL_PRINT_STRING(12)
DECL_PRINT_STRING(11)
DECL_PRINT_STRING(10)
DECL_PRINT_STRING(9)
DECL_PRINT_STRING(8)
DECL_PRINT_STRING(7)
DECL_PRINT_STRING(6)
DECL_PRINT_STRING(5)
DECL_PRINT_STRING(4)
DECL_PRINT_STRING(3)
DECL_PRINT_STRING(2)
DECL_PRINT_STRING(1)
