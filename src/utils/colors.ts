import {
  sourceColorFromImage,
  themeFromSourceColor,
  hexFromArgb,
  Scheme,
  Theme
} from '@material/material-color-utilities';

export interface ThemePalette {
  primary: string;
  secondary: string;
  muted: string;
  background: string;
  // We can add more specific M3 tokens here if needed for direct usage in JS
  surface?: string;
  surfaceContainer?: string;
  onSurface?: string;
  onSurfaceVariant?: string;
}

// Helper to convert Scheme to CSS Variables map
export const applyThemeToDocument = (theme: Theme) => {
  const scheme = document.documentElement.classList.contains('light') ? theme.schemes.light : theme.schemes.dark;
  const root = document.documentElement;

  const setProp = (name: string, argb: number) => {
    root.style.setProperty(name, hexFromArgb(argb));
  };

  // Core Colors
  setProp('--md-sys-color-primary', scheme.primary);
  setProp('--md-sys-color-on-primary', scheme.onPrimary);
  setProp('--md-sys-color-primary-container', scheme.primaryContainer);
  setProp('--md-sys-color-on-primary-container', scheme.onPrimaryContainer);

  setProp('--md-sys-color-secondary', scheme.secondary);
  setProp('--md-sys-color-on-secondary', scheme.onSecondary);
  setProp('--md-sys-color-secondary-container', scheme.secondaryContainer);
  setProp('--md-sys-color-on-secondary-container', scheme.onSecondaryContainer);

  setProp('--md-sys-color-tertiary', scheme.tertiary);
  setProp('--md-sys-color-on-tertiary', scheme.onTertiary);
  setProp('--md-sys-color-tertiary-container', scheme.tertiaryContainer);
  setProp('--md-sys-color-on-tertiary-container', scheme.onTertiaryContainer);

  setProp('--md-sys-color-error', scheme.error);
  setProp('--md-sys-color-on-error', scheme.onError);
  setProp('--md-sys-color-error-container', scheme.errorContainer);
  setProp('--md-sys-color-on-error-container', scheme.onErrorContainer);

  // Surface Colors
  setProp('--md-sys-color-background', scheme.background);
  setProp('--md-sys-color-on-background', scheme.onBackground);
  setProp('--md-sys-color-surface', scheme.surface);
  setProp('--md-sys-color-on-surface', scheme.onSurface);

  // Surface Variants
  setProp('--md-sys-color-surface-variant', scheme.surfaceVariant);
  setProp('--md-sys-color-on-surface-variant', scheme.onSurfaceVariant);
  setProp('--md-sys-color-outline', scheme.outline);
  setProp('--md-sys-color-outline-variant', scheme.outlineVariant);

  // Surface Containers (New in M3)
  // Material Color Utilities might not export these directly on Scheme in all versions,
  // but they are available in the TonalPalettes if we needed them.
  // However, the standard `Scheme` class usually has them in newer versions.
  // If not, we can approximate or use palette.neutral.
  // Let's check if the installed version supports surfaceContainer.
  // If not, we fallback to surface or compute manually.

  // Checking typical M3 tokens:
  // @material/material-color-utilities Scheme interface usually has:
  // surfaceDim, surfaceBright, surfaceContainerLowest, surfaceContainerLow, surfaceContainer, surfaceContainerHigh, surfaceContainerHighest

  // We will try to access them. If TS complains, we can cast or use Neutral palette.
  const s = scheme as any;
  if (s.surfaceContainer) setProp('--md-sys-color-surface-container', s.surfaceContainer);
  else setProp('--md-sys-color-surface-container', theme.palettes.neutral.tone(12)); // Dark mode fallback

  if (s.surfaceContainerHigh) setProp('--md-sys-color-surface-container-high', s.surfaceContainerHigh);
  else setProp('--md-sys-color-surface-container-high', theme.palettes.neutral.tone(17));

  if (s.surfaceContainerHighest) setProp('--md-sys-color-surface-container-highest', s.surfaceContainerHighest);
  else setProp('--md-sys-color-surface-container-highest', theme.palettes.neutral.tone(22));

  if (s.surfaceContainerLow) setProp('--md-sys-color-surface-container-low', s.surfaceContainerLow);
  else setProp('--md-sys-color-surface-container-low', theme.palettes.neutral.tone(10));

  if (s.surfaceContainerLowest) setProp('--md-sys-color-surface-container-lowest', s.surfaceContainerLowest);
  else setProp('--md-sys-color-surface-container-lowest', theme.palettes.neutral.tone(4));
};

export const extractDominantColor = async (imageUrl: string): Promise<ThemePalette | null> => {
  try {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const theme = await themeFromSourceColor(await sourceColorFromImage(img));

    // Apply globally
    applyThemeToDocument(theme);

    // Return the palette structure expected by the rest of the app for now
    // We default to Dark scheme because it's a music player
    const scheme = theme.schemes.dark;

    return {
      primary: hexFromArgb(scheme.primary),
      secondary: hexFromArgb(scheme.secondary),
      muted: hexFromArgb(scheme.onSurfaceVariant),
      background: hexFromArgb(scheme.background),
      surface: hexFromArgb(scheme.surface),
      surfaceContainer: hexFromArgb((scheme as any).surfaceContainer || theme.palettes.neutral.tone(12)),
      onSurface: hexFromArgb(scheme.onSurface),
      onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant)
    };

  } catch (error) {
    console.error("Failed to extract color from image", error);
    return null;
  }
};
