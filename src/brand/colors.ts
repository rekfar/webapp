/**
 * The brand palette in JS form, for anything drawn on canvas or SVG by a
 * library that cannot read CSS custom properties — Leaflet vector styles, for
 * one. Keep in sync with the `--rf-*` tokens at the top of `src/styles.css`.
 */
export const BRAND = {
  cream: '#f6f3ec',
  cream2: '#efeae0',
  charcoal: '#22201c',
  forest: '#263b2e',
  forestDeep: '#1b2b21',
  rust: '#be6a45',
  rustInk: '#a0522c',
  sage: '#8a9a82',
} as const
