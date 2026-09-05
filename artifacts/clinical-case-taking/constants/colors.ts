/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#17324D',
    tint: '#1677A3',

    // Core surfaces
    background: '#F5F8FA',
    foreground: '#17324D',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#17324D',

    // Primary action color (buttons, links, active states)
    primary: '#1677A3',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E6F2F5',
    secondaryForeground: '#143F52',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEF3F5',
    mutedForeground: '#607582',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#EAF6F2',
    accentForeground: '#24755D',

    // Destructive actions (delete, error states)
    destructive: '#C94F4F',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#D8E3E8',
    input: '#C6D5DC',
  },
  dark: {
    text: '#EBF4F7',
    tint: '#68C4D1',
    background: '#0D1F2A',
    foreground: '#EBF4F7',
    card: '#152F3D',
    cardForeground: '#EBF4F7',
    primary: '#68C4D1',
    primaryForeground: '#0E2831',
    secondary: '#1B3B48',
    secondaryForeground: '#EAF7F8',
    muted: '#1A3039',
    mutedForeground: '#ABC0C8',
    accent: '#214F42',
    accentForeground: '#91D7B8',
    destructive: '#F07B7B',
    destructiveForeground: '#0E2831',
    border: '#2B4C59',
    input: '#446270',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
