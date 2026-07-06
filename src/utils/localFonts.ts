/**
 * Local fonts configuration - loads fonts from the font folder
 */

export interface LocalFont {
  family: string;
  file: string;
  weight?: number;
  style?: 'normal' | 'italic';
}

// Map font filenames to display names
const FONT_NAME_MAP: Record<string, string> = {
  'AlexBrush-Regular.ttf': 'Alex Brush',
  'Allura-Regular.ttf': 'Allura',
  'Caveat-Regular.ttf': 'Caveat',
  'CedarvilleCursive-Regular.ttf': 'Cedarville Cursive',
  'DancingScript-Regular.ttf': 'Dancing Script',
  'EuphoriaScript-Regular.ttf': 'Euphoria Script',
  'Festive-Regular.ttf': 'Festive',
  'GrandHotel-Regular.ttf': 'Grand Hotel',
  'GreatVibes-Regular.ttf': 'Great Vibes',
  'IndieFlower-Regular.ttf': 'Indie Flower',
  'IngridDarling-Regular.ttf': 'Ingrid Darling',
  'Italianno-Regular.ttf': 'Italianno',
  'JustAnotherHand-Regular.ttf': 'Just Another Hand',
  'KaushanScript-Regular.ttf': 'Kaushan Script',
  'Lobster-Regular.ttf': 'Lobster',
  'LoversQuarrel-Regular.ttf': 'Lovers Quarrel',
  'MarckScript-Regular.ttf': 'Marck Script',
  'MeaCulpa-Regular.ttf': 'Mea Culpa',
  'Merriweather-VariableFont_opsz,wdth,wght.ttf': 'Merriweather',
  'OleoScript-Regular.ttf': 'Oleo Script',
  'Pacifico-Regular.ttf': 'Pacifico',
  'Parisienne-Regular.ttf': 'Parisienne',
  'PermanentMarker-Regular.ttf': 'Permanent Marker',
  'PinyonScript-Regular.ttf': 'Pinyon Script',
  'Raleway-VariableFont_wght.ttf': 'Raleway',
  'RougeScript-Regular.ttf': 'Rouge Script',
  'Sacramento-Regular.ttf': 'Sacramento',
  'Satisfy-Regular.ttf': 'Satisfy',
  'Tangerine-Regular.ttf': 'Tangerine',
  'Yellowtail-Regular.ttf': 'Yellowtail',
};

// Font files list
const FONT_FILES = [
  'AlexBrush-Regular.ttf',
  'Allura-Regular.ttf',
  'Caveat-Regular.ttf',
  'CedarvilleCursive-Regular.ttf',
  'DancingScript-Regular.ttf',
  'EuphoriaScript-Regular.ttf',
  'Festive-Regular.ttf',
  'GrandHotel-Regular.ttf',
  'GreatVibes-Regular.ttf',
  'IndieFlower-Regular.ttf',
  'IngridDarling-Regular.ttf',
  'Italianno-Regular.ttf',
  'JustAnotherHand-Regular.ttf',
  'KaushanScript-Regular.ttf',
  'Lobster-Regular.ttf',
  'LoversQuarrel-Regular.ttf',
  'MarckScript-Regular.ttf',
  'MeaCulpa-Regular.ttf',
  'Merriweather-VariableFont_opsz,wdth,wght.ttf',
  'OleoScript-Regular.ttf',
  'Pacifico-Regular.ttf',
  'Parisienne-Regular.ttf',
  'PermanentMarker-Regular.ttf',
  'PinyonScript-Regular.ttf',
  'Raleway-VariableFont_wght.ttf',
  'RougeScript-Regular.ttf',
  'Sacramento-Regular.ttf',
  'Satisfy-Regular.ttf',
  'Tangerine-Regular.ttf',
  'Yellowtail-Regular.ttf',
];

// Font file paths - served from public/fonts/ directory
function getFontPath(filename: string): string {
  // Files in public/ are served at the root in both dev and production
  return `/fonts/${filename}`;
}

export const LOCAL_FONTS: LocalFont[] = FONT_FILES.map((file) => ({
  family: FONT_NAME_MAP[file] || file.replace('.ttf', '').replace(/-Regular$/, ''),
  file: getFontPath(file),
  weight: 400,
  style: 'normal',
}));

// Load a font dynamically
export function loadLocalFont(fontFamily: string): void {
  const font = LOCAL_FONTS.find((f) => f.family === fontFamily);
  if (!font || !font.file) return;

  // Create @font-face rule if not already added
  const fontFaceId = `font-face-${fontFamily.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
  if (document.getElementById(fontFaceId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = fontFaceId;
  style.textContent = `
    @font-face {
      font-family: "${fontFamily}";
      src: url("${font.file}") format("truetype");
      font-weight: ${font.weight || 400};
      font-style: ${font.style || 'normal'};
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

// Load all fonts at once
export function loadAllLocalFonts(): void {
  LOCAL_FONTS.forEach((font) => {
    loadLocalFont(font.family);
  });
}
