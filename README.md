# Visual Poetry: The New Typewriter Art

This project is a generative art tool designed to bridge the gap between written sentiment and visual form. Inspired by the legacy of typewriter art and the history of visual poetry, this app transforms raw text into a digital canvas where words function as pixels.

## The Vision

When I write, I often associate specific poems with physical objects—usually flowers or insects. On my Substack, [postcards from chaos](https://kiiraetc.substack.com), I use thumbnails to represent these associations. However, my drafts exist as sterile markdown files.

This project aims to reunite the draft with its visual soul. By using a poem's words as the literal "pixels" of a reference image, the text becomes a texture. It isn't meant to be read in the traditional sense; instead, the poem's structure provides the density and color for the artwork.

## Features

- Poetry Input: Copy and paste raw markdown or text drafts directly into the editor.
- Visual Reference: Upload a reference image (e.g., a photo of a specific flower or insect) to guide the layout and color palette.
- Text-as-Pixel Rendering: Uses `@chenglou/pretext` for line layout, then packs whole words into silhouette-constrained runs (no chopped letters).
- Layout Comparison: Toggle between `Pretext (new)` and `Legacy (previous)` layout modes to compare fitting behavior.
- Detail Controls: Sliders for text size, detail, line height, word spacing, and coverage-vs-detail balance.
- Dark/Light Theming: shadcn token-based theme with mode toggle and consistent component styling.
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

- Paste a poem and upload a JPEG/PNG reference image.
- Pick text and background colors with color pickers (default background is `#1d0202`).
- Choose layout mode (`Pretext` or `Legacy`) and tune text controls.
- Preview updates live.
- Export generated output to PNG at 1x/2x/4x.

## Render pipeline (current)

1. The uploaded image is decoded and sampled into Canvas `ImageData`.
2. A brightness map is computed from luminance (`RGB`) and alpha.
3. Render dimensions (`cols`, `rows`) are derived from image size, `cellSize`, and `lineHeight`.
4. In **Pretext mode**:
  - poem text is prepared with `prepareWithSegments(...)`
  - candidate lines are generated with `layoutNextLineRange(...)`
  - lines are repacked word-by-word into silhouette runs so words are not cut mid-word
  - if a candidate line is too wide, width is reduced and reflow retried from the same cursor
5. In **Legacy mode**:
  - the older manual sequential word placer is used for comparison.
6. Per-glyph visual detail is computed from local brightness contrast:
  - opacity is varied but clamped so glyphs do not fully disappear
  - IBM Plex Mono weight is quantized (`300..700`) to add stroke-density detail
7. The final composition is drawn to canvas using:
  - IBM Plex Mono for generated glyphs
  - User-selected text color and background color

## Theming Notes

- UI uses shadcn semantic tokens (`bg-card`, `border-border`, `text-muted-foreground`, etc.) backed by CSS variables in `app/globals.css`.
- Supports dark/light mode via `next-themes` (`ThemeProvider` + header toggle).
- Slider styling is customized to match the applied shadcn theme look in both light and dark modes.

