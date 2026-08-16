# Styling

First draft of the Rekfar identity, applied across the app chrome.

## Brand

| | |
| --- | --- |
| Typeface | **Space Grotesk** (Google Fonts, weights 400–700) — used throughout |
| Icon mark | **Waypoint dots** — four dots climbing left-to-right, fading in towards the newest fix |
| Lockup | Mark on a rust tile + the wordmark, in `src/brand/Logo.tsx` |

## Tokens

| Token | Hex | Used for |
| --- | --- | --- |
| `--rf-cream` / `--rf-cream-2` | `#f6f3ec` / `#efeae0` | Panel surfaces, page background |
| `--rf-charcoal` | `#22201c` | Body text |
| `--rf-forest` / `--rf-forest-deep` | `#263b2e` / `#1b2b21` | Header, control icons |
| `--rf-rust` | `#be6a45` | Accent — logo tile, selection, position marker |
| `--rf-rust-ink` | `#a0522c` | Accent for text and focus rings (rust is too light on cream) |
| `--rf-sage` | `#8a9a82` | Secondary text on forest |

Tokens live at the top of `src/styles.css`.

## Things that must stay in sync

- The same colour values are mirrored in `src/brand/colors.ts` for Leaflet vector
  styles, which cannot read CSS custom properties — change both together.
- The favicon in `public/favicon.svg` is the waypoint mark on a 64-unit grid;
  keep it in sync with `src/brand/WaypointMark.tsx`.
