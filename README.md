# Visual Poetry: The New Typewriter Art

This project is a generative art tool designed to bridge the gap between written sentiment and visual form. Inspired by the legacy of typewriter art and the history of visual poetry, this app creates generative art from poems using each letter in the text as a pixel.

## The Vision

A tool for turning poems into images, using the words themselves as the pixels.

Each poem I write on my Substack [postcards from chaos](https://kiiraetc.substack.com) is inspired by something physical, usually a flower or an insect. This project started as a way to make that visible. Paste a poem, upload a photo, and the words take the shape of the image's subject. The poem becomes something you look at rather than read.

## Features

- Paste a poem and upload a reference image.
- Turn poem text into image-guided generative artwork.
- Adjust text size, line height, zoom, and colors with a live preview.
- Work in a three-pane layout with dark/light theming.
- Export artwork as PNG or JPG at 1x, 2x, or 4x.

# Tech Stack

- Frontend Framework: Next.js (React)
- Styling: Tailwind CSS, shadcn
- Text Layout Engine: Pretext (by Chenglou)
- Rendering: HTML5 Canvas API (for export) and absolutely-positioned glyph spans (for preview)
- Image Processing: Browser-native Canvas image data for luminance/brightness mapping
- Motion: `framer-motion` for animated glyph reveal / UI transitions, plus `motion` as a DialKit peer dependency
- Color Picker: `react-colorful` wrapped in a custom Radix popover with Hex/RGB/HSL format switching
- Tweak UI: `dialkit` mounted at app root and also used directly for the right-sidebar sliders
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
- Pick text/background colors via the custom popover picker (sat/val square + hue slider + Hex/RGB/HSL input); the browser-native color picker is intentionally not used.
- Tune `Text size`, `Line height`, and `Zoom` in the **Details** panel.
- Preview always centers and fits the subject to the preview area; zoom controls subject size, text size controls glyph density.
- Click the image thumbnail in the **Image** panel to open a larger popover preview of the uploaded reference.
- Export generated output to PNG or JPG at 1x/2x/4x — the exported image has the same logical dimensions as the preview panel multiplied by the chosen scale.

## Render pipeline (current)

1. The uploaded image is decoded and sampled into Canvas `ImageData`.
2. A brightness map is computed from luminance (`RGB`) and alpha.
3. Natural render dimensions (`cols`, `rows`) are derived from image size, `cellSize`, and `lineHeight`.
4. In **Pretext layout**:
  - poem text is prepared with `prepareWithSegments(...)`
  - candidate lines are generated with `layoutNextLineRange(...)`
  - glyphs are packed into contiguous subject runs with adaptive tracking
  - if needed, words can continue on the next run/line without hyphenation
  - line widths are iteratively narrowed and reflowed to maximize in-mask coverage
  - run starts are deterministically staggered (with fallback) to avoid repeated column locking
  - per-glyph horizontal jitter (sub-cell offset) breaks residual vertical banding without reducing fill
  - intra-word tracking now varies by row/run/word seed for more organic cadence and texture
5. Per-glyph visual detail is computed from local brightness contrast:
  - opacity is varied but clamped so glyphs do not fully disappear
  - IBM Plex Mono weight is quantized (`300..700`) to add stroke-density detail
6. **Viewport fit + zoom**:
  - The preview tracks its content area via `ResizeObserver`.
  - `fitScale = min(viewport.W / natural.W, viewport.H / natural.H)` projects the natural-size composition into the preview area.
  - `finalScale = fitScale × zoom` applies the user's zoom multiplier (default `1.0`).
  - The subject is always centered, regardless of text size or aspect ratio.
7. Preview rendering uses positioned glyph spans (`framer-motion`) with a single `transform: scale(finalScale)` applied to the entire group; glyph entry animates with a strong ease-out curve `cubic-bezier(0.23, 1, 0.32, 1)`.
8. Export rendering uses an HTML5 canvas sized to `viewport × outputScale`, fills the background, then draws glyphs using the same fit-scale + zoom + centering math — so the exported PNG/JPG matches the preview pixel-for-pixel (scaled by 1x/2x/4x).

## The Algorithm

This tool does **structured text packing**, not character replacement. The reference image is first analyzed into a tonal field and silhouette bounds, then poem text is continuously reflowed into those bounds with spacing and tracking rules that preserve both shape and texture.

### 1) Image analysis before shaping

Before any glyph is placed:

1. The uploaded image is decoded into Canvas pixel data (`ImageData`).
2. Each pixel is converted into normalized luminance (`0..1`) with alpha awareness.
3. A background baseline is estimated from image corners.
4. For each render row, the algorithm detects subject spans by measuring contrast against that background baseline.
5. The image is then sampled in grid space (`cols x rows`) so every candidate glyph cell can query local brightness.

This means the shape is not guessed from text; it is constrained by measured image structure first, then filled by poem flow.

### 2) Text flow and silhouette packing

For each row:

- The poem is normalized into a looped text stream so the composition does not visibly "restart."
- `@chenglou/pretext` proposes line fragments for the current available width.
- Width is iteratively narrowed when needed so words can actually fit inside detected subject runs.
- Words are placed into contiguous runs with adaptive letter-step tracking.
- If a run is too short for a full word, soft continuation to the next run/row is allowed (without hyphen insertion).

This is why the output keeps poem continuity while still respecting the image silhouette.

### 3) Anti-banding + texture variation

To avoid vertical striping and overly mechanical cadence:

- run starts are deterministically staggered (with fallback to run start if fit fails),
- each glyph gets a tiny deterministic horizontal sub-cell jitter,
- intra-word tracking varies by row/run/word seed (bounded by fit constraints).

All of these are deterministic, so the same input/settings produce stable results in preview and export.

### 4) Opacity and stroke control

After glyph positions are fixed, each glyph receives style from local tone:

- brightness is sampled at the glyph cell,
- local contrast from background is computed,
- a tonal signal is derived and normalized across placed glyphs,
- opacity is curved and clamped (so glyphs never fully disappear),
- font weight is quantized (`300..700`) to add stroke-density variation.

So the image detail is encoded through both **alpha** and **stroke weight**, not only glyph presence/absence.

### 5) Why this is different from classic ASCII art

Classic ASCII art usually maps brightness to a fixed character ramp on a rigid grid (`@%#*+=-:.`), where each cell picks one symbol independently.

This system instead:

- uses your poem text as the source material,
- preserves word flow across the frame,
- packs text inside silhouette runs,
- modulates opacity/weight continuously,
- and introduces controlled micro-irregularity (like physical typing rhythm).

That makes it closer to **typewriter art** than terminal ASCII: constrained, grid-aware, textural mark-making with language-driven material rather than static symbol substitution.

### Parameter Sensitivity (practical tuning)

- `Text size` (`cellSize`): Changes grid density. Smaller values increase glyph count and fine detail; larger values create bolder, more abstract shapes. Does **not** change the rendered subject's physical size in the preview — only how many glyphs make up the image.
- `Line height`: Controls vertical row step. Lower values tighten rows (denser texture); higher values open vertical breathing room and can emphasize stroke direction.
- `Zoom`: Multiplier on the fit-to-viewport scale. Range `30%`–`150%`, default `100%`. Use this to grow or shrink the subject within the preview frame without changing glyph density.
- `Text color` / `Background color`: Do not alter geometric packing, only perception of tonal depth and edge separation.

Tonal contrast strength (formerly the `Details` slider) is fixed at `0.65` in `lib/render/types.ts`. This value is below the posterization threshold so the preview faithfully matches the export.

In practice, start with shape controls (`Text size`, `Line height`) to lock the texture, use `Zoom` to compose the framing, then use colors to tune mood and legibility.

## Theming Notes

- UI uses shadcn semantic tokens (`bg-card`, `border-border`, `text-muted-foreground`, etc.) backed by CSS variables in `app/globals.css`.
- Supports dark/light mode via `next-themes` (`ThemeProvider` + header toggle).
- `DialRoot` is mounted at the app root and receives the resolved `next-themes` mode after mount to avoid hydration mismatches.
- The right-sidebar DialKit sliders also receive the resolved theme, so the toggle switches both the global DialKit panel and the embedded DialKit controls together.
- Sliders use custom themed tracks and horizontal pill thumbs (`ThemeRange` + `.vp-range`) in both light and dark modes. Thumbs gain a subtle hover-puff (gated by `(hover: hover) and (pointer: fine)`) and a press-squeeze.
- Form fields and controls use shared surface styles (`.vp-field`) for consistent border/ring behavior.

## Motion & Interaction Design

Motion in the app is shaped by Emil Kowalski's design-engineering principles ([animations.dev](https://animations.dev/)):

- **Custom easing curves** defined as CSS vars in `app/globals.css` — `--ease-out`, `--ease-in-out`, `--ease-quick` — because built-in CSS easings are too weak for UI work.
- **Scale-on-press feedback** on every pressable (buttons, theme toggle, color swatch, file input, slider thumbs) using `transform: scale(0.94–0.97)` with the shared ease-out curve at 150ms.
- **Specific transitions only** — no `transition: all`; every animated property is named explicitly.
- **Strong ease-out entrance** for the glyph reveal (`cubic-bezier(0.23, 1, 0.32, 1)`), giving each character a snap instead of the previous linear pacing.
- **AnimatePresence icon swap** on the theme toggle (rotate + scale crossfade) replacing the previous instant Sun↔Moon swap.
- **Image preview entry** — uploaded reference image thumbnails fade in while scaling from 90% to 100%, because nothing in the real world appears from nothing.
- **`prefers-reduced-motion`** honored throughout: glyph reveal becomes instant, press-scales are disabled, slider thumb hover-scale is removed.
- **Hover gating** via `@media (hover: hover) and (pointer: fine)` so touch devices don't trigger false hover states on tap.

## Layout

The app is organized into three columns inside a `max-w-screen-2xl` (1536px) container:

| Column | Width | Contents |
| --- | --- | --- |
| Left | `minmax(280px, 340px)` | Header, Poem text, Reference image upload + preview |
| Center | `1fr` | Preview (always fills viewport height) |
| Right | `minmax(240px, 280px)` | Details (text size / line height / zoom), Colors (custom picker), Export (scale + PNG/JPG + action), About |

Below the `lg` breakpoint the columns collapse to a single vertical stack: editor → preview → controls.

