export interface ThemePalette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  background: string;
  onBackground: string;

  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  outline: string;
  outlineVariant: string;

  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

// --- Helpers ---

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; 
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  h = h % 360;
  if (h < 0) h += 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

const toHex = (c: {r:number, g:number, b:number}) =>
  "#" + ((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1);

// Generate Tonal Palette for Dark Mode
function generateTonalPalette(h: number, s: number): ThemePalette {
  // Clamp saturation for better UI colors
  const sPrimary = Math.max(0.6, Math.min(0.9, s));
  const sSecondary = Math.max(0.4, s * 0.7);
  const sTertiary = Math.max(0.5, s * 0.8);
  const sNeutral = s * 0.1;
  const sNeutralVariant = s * 0.2;

  // Hue shifts
  const hSecondary = (h + 15) % 360;
  const hTertiary = (h + 60) % 360; // Triadic shift
  const hError = 0; // Red

  const getColor = (hue: number, sat: number, lum: number) =>
    toHex(hslToRgb(hue, sat, lum));

  return {
    // Primary (L=80 for Dark Mode accessibility)
    primary: getColor(h, sPrimary, 0.80),
    onPrimary: getColor(h, sPrimary, 0.20),
    primaryContainer: getColor(h, sPrimary, 0.30),
    onPrimaryContainer: getColor(h, sPrimary, 0.90),

    // Secondary
    secondary: getColor(hSecondary, sSecondary, 0.80),
    onSecondary: getColor(hSecondary, sSecondary, 0.20),
    secondaryContainer: getColor(hSecondary, sSecondary, 0.30),
    onSecondaryContainer: getColor(hSecondary, sSecondary, 0.90),

    // Tertiary
    tertiary: getColor(hTertiary, sTertiary, 0.80),
    onTertiary: getColor(hTertiary, sTertiary, 0.20),
    tertiaryContainer: getColor(hTertiary, sTertiary, 0.30),
    onTertiaryContainer: getColor(hTertiary, sTertiary, 0.90),

    // Error
    error: getColor(hError, 0.8, 0.80),
    onError: getColor(hError, 0.8, 0.20),
    errorContainer: getColor(hError, 0.8, 0.30),
    onErrorContainer: getColor(hError, 0.8, 0.90),

    // Background & Surface (Dark Mode: L=6-20 range)
    background: getColor(h, sNeutral, 0.06),
    onBackground: getColor(h, sNeutral, 0.90),

    surface: getColor(h, sNeutral, 0.06),
    onSurface: getColor(h, sNeutral, 0.90),
    surfaceVariant: getColor(h, sNeutralVariant, 0.30),
    onSurfaceVariant: getColor(h, sNeutralVariant, 0.80),

    outline: getColor(h, sNeutralVariant, 0.60),
    outlineVariant: getColor(h, sNeutralVariant, 0.30),

    // Surface Container Levels (Tonal Elevation)
    surfaceContainerLowest: getColor(h, sNeutral, 0.04),
    surfaceContainerLow: getColor(h, sNeutral, 0.10),
    surfaceContainer: getColor(h, sNeutral, 0.12),
    surfaceContainerHigh: getColor(h, sNeutral, 0.17),
    surfaceContainerHighest: getColor(h, sNeutral, 0.22),

    // Inverse
    inverseSurface: getColor(h, sNeutral, 0.90),
    inverseOnSurface: getColor(h, sNeutral, 0.20),
    inversePrimary: getColor(h, sPrimary, 0.40),
  };
}

export const extractDominantColor = async (imageUrl: string): Promise<ThemePalette | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { resolve(null); return; }

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const imageData = ctx.getImageData(0, 0, 100, 100).data;
      let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;

      for (let i = 0; i < imageData.length; i += 40) { // Sample every 10th pixel
         const r = imageData[i];
         const g = imageData[i+1];
         const b = imageData[i+2];
         const a = imageData[i+3];

         if (a < 128) continue;

         rTotal += r;
         gTotal += g;
         bTotal += b;
         count++;
      }

      if (count === 0) { resolve(null); return; }

      const r = rTotal / count;
      const g = gTotal / count;
      const b = bTotal / count;

      const { h, s } = rgbToHsl(r, g, b);

      resolve(generateTonalPalette(h, s));
    };

    img.onerror = () => resolve(null);
  });
};
