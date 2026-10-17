# Sitong Hao — Portfolio

Sitong's portfolio at **o-ohst.github.io**. It uses the same template as
Jonas' site (React, TypeScript, Vite), restyled for a
modern look: cool slate and white with an indigo-to-cyan accent, Space Grotesk
headings over Manrope, and no Chinese theming. No backend, no analytics.

## Design and content

- `src/data/content.ts` holds the projects, experience, education, skills and
  contact details, from Sitong's October 2026 résumé. `FEATURED` in
  `src/App.tsx` sets the lead order of the project cards.
- The hero is the **Agent Office** from observe-agents-do-things (uncredited
  on the page by request; no caption, just the pause button), drawn live on a transparent canvas (`OfficeHero.tsx` → lazy
  `src/office/engine.ts`). One simulated coding-agent session doing everyday
  engineering (ETL pipelines, APIs, tests, CI) lives in
  `src/office/simulation.ts`. It runs on virtual time, so it pauses offscreen,
  in hidden tabs and with the pause button; reduced motion starts it paused on
  a still frame. The office source is vendored, see
  `src/office/vendor/VENDORED.md`. `?office=day` / `?office=night` pins the
  lighting for screenshots.
- There is no portrait: the technology globe orbits an empty centre.
- Company and school marks are each organisation's published icon; where each
  came from is in `public/LOGOS.md`. Technology marks are simple-icons (CC0).
- The procedural landscape in Contact is the template's, recoloured.
- `src/index.css` is Jonas' stylesheet with its palette remapped (jade, ivory
  and gold become slate, white and indigo) plus a short block of Sitong's own
  rules at the end. Edit it directly.

## Local development

```sh
npm ci
npm run dev      # :5176
npm run lint
npm run build
node tools/optimize-images.mjs   # WebP renditions of public/projects/*.jpg
```

## Release

Push to `main`. `.github/workflows/deploy.yml` lints, builds and deploys `dist/`
to GitHub Pages at **https://o-ohst.github.io**. Needs Node 22+ locally (Vite 8).

Moved out of the `kiasubot` monorepo (`apps/portfolios/haositong`), which
still holds a copy served at haositong.kiasubot.com.
