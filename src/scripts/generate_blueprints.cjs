const fs = require('fs');
const path = require('path');

const RAW = {
    "knight": {
        "paleta": {
            " ": "transparent",
            "A": "#000000",
            "B": "#567194",
            "C": "#3a4e69",
            "D": "#253347",
            "E": "#ffdbac",
            "F": "#bdc3c7",
            "G": "#e4e7ec",
            "H": "#7f8c8d",
            "I": "#ffffff",
            "J": "#5d4037"
        },
        "blueprint": [
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                           AAAAAA                               ",
            "                          ABBBBBBAA                             ",
            "                         ABBBBBBBBBA                            ",
            "                        ABBBBBBBBBCDA                           ",
            "                        ABBBBBBBBCCDA                           ",
            "                        ABBBAAAAAAADA                           ",
            "                        ABBBEEEEEEEDA                           ",
            "                        ABBBEEAEEAEDA                           ",
            "                        ABBBEEAEEAEDA                           ",
            "                        ABBBEEEEEEEDA                           ",
            "                        ABBBBBCCCCCDA                           ",
            "                        ABBBBBCCCCCDA                           ",
            "                       ACCBBBBCCCCCDA                           ",
            "                      AABBCBBBCCCCDDAA                          ",
            "                     AFGAABCBBCCCCDAAAA                         ",
            "                    AFFGFFACBBCCCCAAFFFA                        ",
            "                   AFFGFFFACCCCCCAHAGGFFA                       ",
            "                   AFFGFFFA AAAAAHHAGGGFFA                      ",
            "                  AFFGFFFFAHHHHHHHHAFGGGFA                      ",
            "                  AFFGFFFAHHHHHHHHHAFFGGFA                      ",
            "                  AGGGGGAHHHHHHHHHHAAAAAAA                      ",
            "                   AAAAAAFHHHHHHHHAGGGGGGGA                     ",
            "                   AFFFFAFHHHHHHHAGGCCCCCIGA                    ",
            "                   AHHFFAFFHHHHHHAGCCCCCCCGGA                   ",
            "                   AHHHFAFFFHHHHAICCCCCCCCCGA                   ",
            "                   AHHHFAFFFHHHHAICCCFFFCCCGA                   ",
            "                   AHHHHAAAAAAAAAGCCCFCFCCCGA                   ",
            "                   AHHHHAJJJJJJJAICCCFFFCCCGA                   ",
            "                   AAAAAAJJJJJJJAICCCCCCCCCGA                   ",
            "                   AEEEEAAAAAAAAAIICCCCCCCGGA                   ",
            "                   AEEEEAFHACCCCCAIICCCCCGGA                    ",
            "                   AAEEEAFHABBBBCCAIICCCGGA                     ",
            "                  ADCAAAFFHABBBBBCAAIICGGA                      ",
            "                 ADCCDDAFHHABBBBBCAAAIIGA                       ",
            "                 ACCCDDAFHHABCBBBCAAAAGA                        ",
            "                 ACCCDDAFHHABCBBBCAAHAA                         ",
            "                 ACCCDDAFHHABCBBBCAAHA                          ",
            "                ACCCCDDAFHHABCBCBCAAHA                          ",
            "               ADCDCDDDAFHHABBBCBCAAHA                          ",
            "               ACCDCCDDAAAAABBBCBCAAAA                          ",
            "               ACCCCCDDACCBBABBCBACCBA                          ",
            "               ACCCCCDDACCBBAABCACCCBA                          ",
            "              ACCDCCCDDACCBBADAAACCCBA                          ",
            "             ADCCCCDCDDAAAAAADDDAAAAAA                          ",
            "            ACCCCCCDDDDAAAJJADDDAAAAJA                          ",
            "            ACCDCCCCCDDAAAJJADDDAAAJJA                          ",
            "             AADCCDDDDAAAAJJADDDAAAJJAA                         ",
            "              AAAAAAAAAAAAJJAAAAAAJJJJA                         ",
            "                      AJJJJJA   AJJJJJA                         ",
            "                      AAAAAAA   AAAAAAA                         ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                "
        ]
    },
    "wizard": {
        "paleta": {
            " ": "transparent",
            "A": "#000000",
            "B": "#8a2be2",
            "C": "#4f1c78",
            "D": "#ffffff",
            "E": "#5d4037",
            "F": "#ffdbac",
            "G": "#09eeff",
            "H": "#9969ab",
            "I": "#d395e9",
            "J": "#05eeff",
            "K": "#501c78"
        },
        "blueprint": [
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                           AAAAAA                               ",
            "                          ABBBBBCAA                             ",
            "                         ABBBBCCCCCA                            ",
            "                       AABBBBBCCCCCCA                           ",
            "                       ACBBBBBAAAACCA       AAAA                ",
            "                       ACBBAAAAAAAACA       ADEAA               ",
            "                       ACBBAAAAAAAACA     AAADDEAAA             ",
            "                     AACCBAFFFFAFFACA     ADGAAEEEA             ",
            "                    AACCBBAFFFFFFFACA     AGGGADEAA             ",
            "                    ACCBBAAFFAFFAFACA     AAAAAEEA              ",
            "                   AABBBBAFFFAFFAFACA      AADEEEA              ",
            "                   ACBBBBAFFFFFFFFACA       AEEEAA              ",
            "                   ACBBBBAAFFFFFFFACA       AEEEA               ",
            "                   ABBBCCCAAAFFFAAACAA      AAEAA               ",
            "                   AAAAACCAAAFFFAAAAAAA      AEA                ",
            "                   AACCACCAAAFFFAAAACCCA     AEA                ",
            "                   ABBBAAAAAAAAAAAHACCBBA    AEA                ",
            "                  ABBBBCCCAHHHIHIHHACBBBBA   AEE                ",
            "                 ABBBBBCCCAHHHJHHHHACBBBBA   AEE                ",
            "                 ABBBBCCCAIIIJJJIHHAAABBBAA  AEE                ",
            "                 ABCBBCCAIIIIJJJIHHAAAAABBA  AEE                ",
            "                 AAABBCAAIIIIIJIIHHAAHHHAAAAAAEA                ",
            "                 AAAAAAAAIIIIIIIIHHAAHHHHIAAFAEA                ",
            "                 ABAAHHHAIIIIIIIIHHAAHHHHIAAFAAA                ",
            "                 ABAIIHHAIIIIIIHHHHAAHHHHIAAFFFA                ",
            "                 ABAIIHHAIIIIIHHHHHAAHHHIIAAFFFA                ",
            "                 ABAIIHHAAAAAAAAAAAAAHIHIIAAFFFA                ",
            "                 ABAIIHHAEEEEEEEEEEAAHIIIIAAAAAA                ",
            "                 ABAAAAAAEEEEEEEEEEAAAIIIIAA AEA                ",
            "                 ABAFFFFAAAAAAAAAAAAAAAIIIAA AEA                ",
            "                 ABAFFFFAAAABBBBBAAAAAAIIIAA AEA                ",
            "                 ABAAFFFAHHABBBBBAAAAAAAAIAA AEA                ",
            "                 ABBCAAAIIHABBBCBAAAAAKKAAAA AEA                ",
            "                 ABBCCAAIIHABBBCBAAAAAKKKBBA AEA                ",
            "                 ABBCCAAIHHABBBCBAAAHAKKKBBA AEA                ",
            "                 ABBCCAAIHHABCBBBAAAHAKKKBBA AEA                ",
            "                 ABBCCAAIHHABBBBBAAAHAKKKBBA AEA                ",
            "                ACBBCCAAIHHABBBCBAAAHAKKKBBA AEA                ",
            "               ACCBBCCAAIIIABBBBBAAAHAKBBBBA AEA                ",
            "               ACCBBCCAAAAAABBBBCAAHHAKBBKBA AEA                ",
            "               ABCBCCCAAHHHHABBBCAHHHAKBBKBA AEA                ",
            "               ABCBCCCAAHHHHAABBCHHHHAKBBKBA AEA                ",
            "              ABBCBCCCAAHHIHAAAAAHHHHAKBBBBA AEA                ",
            "             ABCBBBCCCAAAAAAACAAAAAAAAKBBBBA AEA                ",
            "            ACBBBBBBCCAAAAEEACCAAAAAEAKKBBBA AEA                ",
            "            ACBBBBBBCCAAAAEEACCAAAAEEAKKKAAA AEA                ",
            "             AABBBBBCCAAAAEEACCAAAAEEAAAAA   AEA                ",
            "              AAAAAAAAAAAAEEAAAAAAEEEEA      AEA                ",
            "                      AEEEEEA   AEEEEEA      AEA                ",
            "                      AAAAAAA   AAAAAAA      AAA                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                "
        ]
    },
    "picaro": {
        "paleta": {
            " ": "transparent",
            "A": "#000000",
            "B": "#5d4037",
            "C": "#301b03",
            "D": "#ffdbac",
            "E": "#eeb677",
            "F": "#efb677",
            "G": "#355f02",
            "H": "#274106",
            "I": "#355f03",
            "J": "#000402",
            "K": "#011e0c"
        },
        "blueprint": [
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                AA                              ",
            "                              AAAAA                             ",
            "                         AAAAAABBBAAA                           ",
            "                         ABBBBBBBBCAA                           ",
            "                       AABBCCBBCCBCCA                           ",
            "                       ABBCCCCCBBBBCAA                          ",
            "                       ABBBACCCBBBBCCA                          ",
            "                       ABCBCAAAAAAAAAA                          ",
            "                      AACCAADDDDDDA                             ",
            "                      ABCAADDADDADA                             ",
            "                      ABCADDDADDADA                             ",
            "                      AAAADDDDDDDDA                             ",
            "                        AAADDDDDDDA                             ",
            "                        ACADEDDDDAA                             ",
            "                        ACADDEFEA                               ",
            "                        AAADDDDFA                               ",
            "                     AAAAAADDDDDAAAAAAA                         ",
            "                    AAGHGGGAAADDAAGGGGAAA                       ",
            "                   AAAAHHGGGGAAAAGHHGGAHA                       ",
            "                   AGGAAGHHGGGGGGGHHGAHHAA                      ",
            "                   AGGHAAAGGHHHHHGHHIAHHHA                      ",
            "                   AGGHAAAGGGGGGGHIAAAHHHA                      ",
            "                   AAAAAAAAAAAAAAAAHHAAAAA                      ",
            "                   AFFFFAGHHHHHHHHHHHAFFFA                      ",
            "                   AAAAAAGGGGGGGGHHHHAFDDA                      ",
            "                  ABBBBBAGGGGGGGGGGGHAAAAA                      ",
            "                   ABBBBAAAAAAAAAAAAAABBBBA                     ",
            "                   ABBBBABBBBBBBBBBBAABBBA                      ",
            "                   AAAAAABBBBBBBBBBBAABBBA                      ",
            "                   AFFFFAAAAAAAAAAAAAAAAAA                      ",
            "                   AFDDDAHHHHHHHHHGGHADDDA                      ",
            "                   AADDDAHHHHGGGGGGGHADDAA                      ",
            "                     AAAHHHGGGGGGGGGHAAAA                       ",
            "                      AAHGGGGGGGGGGGHA                          ",
            "                      AAHHGGGHHHHHHHHA                          ",
            "                      AAHHHHHHHHHHHHHA                          ",
            "                      AAAAAAAAAAAAAAAA                          ",
            "                       AJJJJA   AJJJJA                          ",
            "                       AKKJJA   AJJKKA                          ",
            "                       AKKKJA   AJKKKA                          ",
            "                       AJKKKA   AKKKJA                          ",
            "                      AAAAAAAA AAAAAAAA                         ",
            "                      ABBBBBAA AABBBBBA                         ",
            "                      AAAAAAAA AAAAAAAA                         ",
            "                       AAABBA   AAAABA                          ",
            "                       AAABBA   AAABBA                          ",
            "                      AAAABBA   AAABBAA                         ",
            "                      AAAABBA   AABBBBA                         ",
            "                      ABBBBBA   ABBBBBA                         ",
            "                      AAAAAAA   AAAAAAA                         ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                ",
            "                                                                "
        ]
    }
};

// Tool to clone and remap colors
function createVariant(baseName, colorMap) {
    const base = RAW[baseName];
    // Copy blueprint directly
    const blueprint = [...base.blueprint];
    
    // Copy palette and apply overrides
    const paleta = { ...base.paleta };
    for (const [key, oldColor] of Object.entries(paleta)) {
        if (colorMap[oldColor]) {
            paleta[key] = colorMap[oldColor];
        } else if (colorMap[key]) {
            paleta[key] = colorMap[key];
        }
    }

    return { paleta, blueprint };
}

// Generate the 14 classes!
const classesData = {};

// 1. Fighter (Guerrero)
classesData['fighter'] = RAW.knight;

// 2. Paladin (Knight based, Gold/Silver)
classesData['paladin'] = createVariant('knight', {
    "#567194": "#f1c40f", // Gold
    "#3a4e69": "#f39c12", // Gold darker
    "#253347": "#e67e22", // Gold darkest
    "#bdc3c7": "#ffffff", // Pure white armor highlights
    "#e4e7ec": "#ecf0f1",
    "#7f8c8d": "#bdc3c7"
});

// 3. Wizard (Mago)
classesData['wizard'] = RAW.wizard;

// 4. Rogue (Pícaro)
classesData['rogue'] = RAW.picaro;

// 5. Cleric (Clérigo - Wizard based, White/Gold)
classesData['cleric'] = createVariant('wizard', {
    "#8a2be2": "#ffffff", // Pure white
    "#4f1c78": "#f1c40f", // Gold trim
    "#9969ab": "#ecf0f1",
    "#d395e9": "#bdc3c7",
    "#501c78": "#f39c12"
});

// 6. Ranger (Explorador - Rogue based, Brown/Greenish)
classesData['ranger'] = createVariant('picaro', {
    "#355f02": "#27ae60", // Bright green
    "#274106": "#1e8449", // Dark green
    "#355f03": "#145a32"  // Darkest green
});

// 7. Barbarian (Bárbaro - Knight based, but "armor" is bare chest/fur)
classesData['barbarian'] = createVariant('knight', {
    "#567194": "#cb4335", // Red warpaint / cloth
    "#3a4e69": "#a93226", 
    "#253347": "#7b241c",
    "#bdc3c7": "#ffdbac", // Bare skin!
    "#e4e7ec": "#e5c298", // Skin light
    "#7f8c8d": "#c2a37f"  // Skin dark
});

// 8. Bard (Bardo - Rogue based, Purple/Orange)
classesData['bard'] = createVariant('picaro', {
    "#355f02": "#9b59b6", // Purple
    "#274106": "#8e44ad", // Dark purple
    "#355f03": "#e67e22",  // Orange trim
    "#5d4037": "#f1c40f"   // Gold instrument details
});

// 9. Druid (Druida - Wizard based, Green/Brown)
classesData['druid'] = createVariant('wizard', {
    "#8a2be2": "#27ae60",
    "#4f1c78": "#1e8449",
    "#9969ab": "#8e44ad", // slight violet touch
    "#d395e9": "#58d68d",
    "#501c78": "#145a32",
    "#09eeff": "#2ecc71", // Green magic
    "#05eeff": "#2ecc71"
});

// 10. Monk (Monje - Rogue based, Orange/Yellow)
classesData['monk'] = createVariant('picaro', {
    "#355f02": "#e67e22", // Orange
    "#274106": "#d35400", // Dark Orange
    "#355f03": "#f1c40f", // Yellow
    "#eeb677": "#f1c40f"
});

// 11. Necromancer (Nigromante - Wizard based, Black/Purple)
classesData['necromancer'] = createVariant('wizard', {
    "#8a2be2": "#2c3e50", // Dark grey/black
    "#4f1c78": "#1a252f", // Near black
    "#9969ab": "#8e44ad", // Purple trims
    "#d395e9": "#9b59b6",
    "#501c78": "#1abc9c", // Cyan glowing
    "#09eeff": "#8e44ad", // Purple magic
    "#05eeff": "#9b59b6"
});

// 12. Antipaladin (Antipaladín - Knight based, Black/Red)
classesData['antipaladin'] = createVariant('knight', {
    "#567194": "#2c3e50", // Black steel
    "#3a4e69": "#1a252f",
    "#253347": "#11151c",
    "#bdc3c7": "#c0392b", // Red
    "#e4e7ec": "#e74c3c", // Bright red
    "#7f8c8d": "#922b21"
});

// 13. Sorcerer (Hechicero - Wizard based, Red/Orange)
classesData['sorcerer'] = createVariant('wizard', {
    "#8a2be2": "#c0392b", // Red
    "#4f1c78": "#922b21", // Dark Red
    "#9969ab": "#e67e22", // Orange
    "#d395e9": "#f39c12",
    "#501c78": "#d35400",
    "#09eeff": "#f1c40f", // Fire magic
    "#05eeff": "#f39c12"
});

// 14. Scout (Cazador - Rogue based, Camo)
classesData['scout'] = createVariant('picaro', {
    "#355f02": "#7cb342", // Olive green
    "#274106": "#558b2f",
    "#355f03": "#33691e",
    "#5d4037": "#8d6e63" // Brown cloak elements
});

// Directory checks
const buildDir = path.join(__dirname, '../data');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Write file
fs.writeFileSync(
    path.join(buildDir, 'character_blueprints.json'),
    JSON.stringify(classesData, null, 2),
    'utf-8'
);

console.log("Blueprints generated successfully at src/data/character_blueprints.json");

