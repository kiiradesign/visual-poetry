# Visual Poetry: The New Typewriter Art

This project is a generative art tool designed to bridge the gap between written sentiment and visual form. Inspired by the legacy of typewriter art and the history of visual poetry, this app transforms raw text into a digital canvas where words function as pixels.

## The Vision

When I write, I often associate specific poems with physical objects—usually flowers or insects. On my Substack, postcards from chaos, I use thumbnails to represent these associations. However, my drafts exist as sterile markdown files.

This project aims to reunite the draft with its visual soul. By using a poem's words as the literal "pixels" of a reference image, the text becomes a texture. It isn't meant to be read in the traditional sense; instead, the poem's structure provides the density and color for the artwork.

## Features

- Poetry Input: Copy and paste raw markdown or text drafts directly into the editor.
- Visual Reference: Upload a reference image (e.g., a photo of a specific flower or insect) to guide the layout and color palette.
- Text-as-Pixel Rendering: Utilizing the pretext library to manipulate text layout at a granular level.
- Generative Export: Save the resulting visual poetry as a high-resolution image.

# Tech Stack

- Frontend Framework: Next.js (React)
- Styling: Tailwind CSS
- Text Layout Engine: Pretext (by Chenglou)
- Rendering: HTML5 Canvas API (to handle the pixel-level text placement)
- Animation: Framer Motion (for UI transitions)
- Image Processing: Browser-native Canvas image data for color extraction
- Version Control: Git and GitHub
- Deployment: Not yet planned

## Project Structure

Languages: JavaScript/TypeScript
File Formats: Markdown (for poem drafts) and standard image formats (JPEG/PNG) for reference photos