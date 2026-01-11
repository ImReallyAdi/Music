# Material Design 3 System - Adi Music

## 1. Component Structure

The application follows a hierarchical component structure rooted in `App.tsx`, leveraging strictly **Material Web** components for UI elements.

### Hierarchy
- **`App.tsx`**: Root provider. Manages global state (`LibraryState`, `PlayerState`), Audio Engine (`useAudioPlayer`), and routing/view switching.
- **`Layout.tsx`**: Wrapper for persistent UI elements (Background Ambience, Bottom Navigation).
- **`Home.tsx`**: Dashboard view.
    - Uses: `<md-assist-chip>`, `<md-filled-tonal-button>`, `<md-filled-button>`, `<md-icon>`
- **`Search.tsx`**: Search & Import interface.
    - Uses: `<md-outlined-text-field>`, `<md-filter-chip>`, `<md-filled-button>`, `<md-list-item>`
- **`Library.tsx`**: Media collection management.
    - Uses: `<md-tabs>`, `<md-list>`, `<md-list-item>`, `<md-switch>`, `<md-icon-button>`
- **`FullPlayer.tsx`**: Immersive playback view.
    - Uses: `<md-slider>`, `<md-filled-icon-button>`, `<md-icon-button>`
- **`MiniPlayer.tsx`**: Persistent playback control.
    - Uses: `<md-linear-progress>`, `<md-icon-button>`

## 2. Layout Suggestions

The UI is designed to be **responsive**, **grid-based**, and **touch-friendly**.

### Grid System
- **Mobile (< 768px)**: Single column fluid layout.
- **Tablet/Desktop (>= 768px)**: Responsive Grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`).
- **Safe Areas**: Use `.pt-safe` and `.pb-safe` utilities to respect iOS notches and home indicators.

### Navigation
- **Mobile**: `BottomNav` (Sticky bottom, glassmorphism).
- **Desktop**: Could evolve into a `NavigationRail` (future improvement), currently shares `BottomNav` or hides it in immersive views.

## 3. Color Palette (Material 3 Expressive)

Colors are defined as CSS variables in `index.css` and mapped to Tailwind config.

| Token | Hex | Role |
|-------|-----|------|
| `--md-sys-color-primary` | `#D0BCFF` | Key actions, active states, progress bars |
| `--md-sys-color-on-primary` | `#381E72` | Text on primary buttons |
| `--md-sys-color-secondary` | `#CCC2DC` | Tonal buttons, active indicators |
| `--md-sys-color-tertiary` | `#EFB8C8` | Accents, "Discovery" features |
| `--md-sys-color-surface` | `#121016` | Main background (OLED optimized) |
| `--md-sys-color-surface-container` | `#211F26` | Cards, modals, lists |

**Dynamic Color**: The app extracts the dominant color from album artwork and applies it to the background ambience and `theme-color` meta tag.

## 4. Spacing & Motion Guidance

### Spacing
- **Base Unit**: `4px`
- **Padding**:
    - Container: `p-4` (16px) or `p-6` (24px)
    - Card: `p-3` (12px)
    - List Item: `py-2` (8px)
- **Corner Radius**:
    - Cards: `rounded-[24px]` (Large)
    - Buttons/Chips: `rounded-full` or `rounded-[16px]`
    - Dialogs: `rounded-[28px]`

### Motion (Framer Motion)
- **Page Transitions**: `opacity` and `y` slide (stiffness: 300, damping: 30).
- **Micro-interactions**:
    - Hover: `scale: 1.02`
    - Tap: `scale: 0.96`
- **Lists**: `staggerChildren` (0.05s) for cascading entry.
- **Player**: Spring physics (`type: "spring", damping: 25`) for draggable sheets.

## 5. Example Material Web Component Usage

**Do not use standard HTML elements for interactive controls.**

### Button
```tsx
// ❌ Avoid
<button className="bg-primary text-white p-4 rounded">Play</button>

// ✅ Use Material Web
import '@material/web/button/filled-button.js';
import '@material/web/icon/icon.js';

<md-filled-button onClick={handlePlay}>
  <md-icon slot="icon">play_arrow</md-icon>
  Play
</md-filled-button>
```

### List Item
```tsx
// ❌ Avoid
<div className="flex items-center gap-4 border-b">...</div>

// ✅ Use Material Web
import '@material/web/list/list-item.js';

<md-list-item
    type="button"
    headline="Song Title"
    supporting-text="Artist Name"
>
    <div slot="start" className="w-10 h-10 rounded-full bg-gray-200">...</div>
    <md-icon slot="end">more_vert</md-icon>
</md-list-item>
```

### Slider
```tsx
// ✅ Use Material Web
import '@material/web/slider/slider.js';

<md-slider
    min="0"
    max="100"
    value={progress}
    labeled
></md-slider>
```
