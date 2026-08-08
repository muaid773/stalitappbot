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
    text: '#F5F7FA',
    tint: '#43D6C4',

    // Core surfaces
    background: '#07151C',
    foreground: '#F5F7FA',

    // Cards / elevated surfaces
    card: '#10262D',
    cardForeground: '#F5F7FA',

    // Primary action color (buttons, links, active states)
    primary: '#43D6C4',
    primaryForeground: '#07151C',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#18343C',
    secondaryForeground: '#D6E8E8',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#18343C',
    mutedForeground: '#8DA8AE',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F4B860',
    accentForeground: '#07151C',

    // Destructive actions (delete, error states)
    destructive: '#F06B6B',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#24444C',
    input: '#24444C',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
