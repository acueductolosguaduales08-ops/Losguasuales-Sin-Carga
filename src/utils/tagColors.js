/**
 * Assigns a consistent HSL color to a tag string based on a simple hash.
 * Returns { bg, text, border, bgGlass } for light/dark/glassmorphism usage.
 */
const TAG_PALETTE = [
  { h: 142, s: 72, l: 45 }, // emerald
  { h: 221, s: 83, l: 53 }, // blue
  { h: 262, s: 83, l: 58 }, // violet
  { h: 340, s: 82, l: 52 }, // rose
  { h: 25, s: 95, l: 53 },  // orange
  { h: 175, s: 80, l: 42 }, // teal
  { h: 292, s: 69, l: 53 }, // purple
  { h: 48, s: 96, l: 53 },  // amber
  { h: 199, s: 89, l: 48 }, // sky
  { h: 330, s: 81, l: 60 }, // pink
  { h: 84, s: 81, l: 44 },  // lime
  { h: 0, s: 84, l: 60 },   // red
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getTagColor(tag) {
  const idx = hashStr(tag.toLowerCase()) % TAG_PALETTE.length;
  const { h, s, l } = TAG_PALETTE[idx];
  return {
    hsl: `${h} ${s}% ${l}%`,
    bg: `hsl(${h}, ${s}%, ${l}%)`,
    bgLight: `hsl(${h}, ${s}%, 95%)`,
    bgDark: `hsl(${h}, ${s}%, 25%)`,
    text: `hsl(${h}, ${s}%, 100%)`,
    textDark: `hsl(${h}, ${s}%, 85%)`,
    border: `hsl(${h}, ${s}%, 75%)`,
    borderDark: `hsl(${h}, ${s}%, 35%)`,
    // Glassmorphism: semi-transparent bg + blur
    glass: `hsla(${h}, ${s}%, ${l}%, 0.25)`,
    glassDark: `hsla(${h}, ${s}%, ${l}%, 0.3)`,
    glassBorder: `hsla(${h}, ${s}%, ${l}%, 0.4)`,
  };
}
