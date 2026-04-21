# Visual Poetry: The New Typewriter Art

This project is a generative art tool designed to bridge the gap between written sentiment and visual form. Inspired by the legacy of typewriter art and the history of visual poetry, this app transforms raw text into a digital canvas where words function as pixels.

## The Vision

When I write, I often associate specific poems with physical objects—usually flowers or insects. On my Substack, [postcards from chaos](https://kiiraetc.substack.com), I use thumbnails to represent these associations. However, my drafts exist as sterile markdown files.

This project aims to reunite the draft with its visual soul. By using a poem's words as the literal "pixels" of a reference image, the text becomes a texture. It isn't meant to be read in the traditional sense; instead, the poem's structure provides the density and color for the artwork.

## Features

- Poetry Input: Copy and paste raw markdown or text drafts directly into the editor.
- Visual Reference: Upload a reference image (e.g., a photo of a specific flower or insect) to guide the layout and color palette.
- Text-as-Pixel Rendering: Uses `@chenglou/pretext` only (legacy mode removed), with silhouette-constrained packing and seamless text looping.
- Detail Controls: Sliders for details, text size, line height, and word spacing.
- Dark/Light Theming: shadcn token-based theme with mode toggle and consistent component styling.
- Theme-aware Defaults: Light mode defaults to warm paper/ink (`#F4F1EA` / `#2D2926`) and dark mode to Prussian blue/pale blue-white (`#003153` / `#E6EEF2`).
- Animated Preview: Hammer-strike style glyph reveal on image load/refresh; slider changes do not retrigger animation.
- Generative Export: Save the resulting visual poetry as a high-resolution image.

# Tech Stack

- Frontend Framework: Next.js (React)
- Styling: Tailwind CSS, shadcn
- Text Layout Engine: Pretext (by Chenglou)
- Rendering: HTML5 Canvas API (to handle the pixel-level text placement)
- Image Processing: Browser-native Canvas image data for luminance/brightness mapping
- Version Control: Git and GitHub

## Project Structure

Languages: JavaScript/TypeScript
File Formats: Markdown (for poem drafts) and standard image formats (JPEG/PNG) for reference photos

# References & Inspiration

Visual Poetry (Wikipedia): A comprehensive look at the history and evolution of the form, from antiquity to modern concrete poetry. [Link](https://en.wikipedia.org/wiki/Visual_poetry)

Typewriter Art (The Marginalian): An exploration of how the constraints of a grid-based text system were first used to create complex imagery, which serves as the spiritual predecessor to this project. [Link](https://www.themarginalian.org/2014/05/23/typewriter-art-laurence-king/)

# How it Works

## Run locally

1. Install dependencies:
  - `npm install`
2. Start the app:
  - `npm run dev`
3. Open:
  - `http://localhost:3000`

## Current MVP behavior

- Paste a poem and upload a JPEG/PNG reference image (image persists across refresh via local storage).
- Pick text/background colors using direct swatch color controls (no hex text shown inline).
- Tune `Details`, `Text size`, `Line height`, and `Word spacing`.
- Preview updates live with pretext-only layout.
- Export generated output to PNG at 1x/2x/4x.

## Render pipeline (current)

1. The uploaded image is decoded and sampled into Canvas `ImageData`.
2. A brightness map is computed from luminance (`RGB`) and alpha.
3. Render dimensions (`cols`, `rows`) are derived from image size, `cellSize`, and `lineHeight`.
4. In **Pretext layout**:
  - poem text is prepared with `prepareWithSegments(...)`
  - candidate lines are generated with `layoutNextLineRange(...)`
  - glyphs are packed into contiguous subject runs with adaptive tracking
  - if needed, words can continue on the next run/line without hyphenation
  - line widths are iteratively narrowed and reflowed to maximize in-mask coverage
5. Per-glyph visual detail is computed from local brightness contrast:
  - opacity is varied but clamped so glyphs do not fully disappear
  - IBM Plex Mono weight is quantized (`300..700`) to add stroke-density detail
6. Preview rendering uses positioned glyph spans (`framer-motion`) for controlled animation timing.
7. Export rendering uses canvas with the same layout and color settings for PNG output parity.

## Theming Notes

- UI uses shadcn semantic tokens (`bg-card`, `border-border`, `text-muted-foreground`, etc.) backed by CSS variables in `app/globals.css`.
- Supports dark/light mode via `next-themes` (`ThemeProvider` + header toggle).
- Sliders use custom themed tracks and horizontal pill thumbs (`ThemeRange` + `.vp-range`) in both light and dark modes.
- Form fields and controls use shared surface styles (`.vp-field`) for consistent border/ring behavior.

## Paper Workflow

Current design iteration flow with Paper MCP:

1. Create or select a Paper frame representing the target UI state (light/dark variants can be separate frames).
2. Make visual edits directly on canvas (spacing, card grouping, typography hierarchy, controls, slider look).
3. Sync selected frame to code by pulling frame structure/styles (`get_selection`, `get_tree_summary`, `get_jsx`) and mapping deltas into React/Tailwind components.
4. Keep Paper-specific visual-only affordances (e.g., static slider thumbs in mockups) while preserving interactive behavior in code.
5. Validate with lint/build and verify browser parity against the selected Paper frame.

Notes:

- Paper is used as the design source of truth for layout and style direction during iteration.
- Code remains the source of truth for runtime behavior (render pipeline, animation triggers, exports, preprocessing).

