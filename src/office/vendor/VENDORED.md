# Vendored: The Agent Office from observe-agents-do-things

Copied from https://github.com/Dri-water/observe-agents-do-things (MIT) at commit `7ab18d524b54c6206f551bf4e8fdf721650cee19` (v0.2.1).

| Here | Upstream |
| --- | --- |
| `protocol/*` | `packages/protocol/src/*` |
| `diff.ts` | `packages/core/src/diff.ts` |
| `shared/{theme,color,dom,buddy}.ts` | `apps/web/src/shared/` |
| `office/{iso,blob,model,render}.ts` | `apps/web/src/viz/office/` |

Only import paths were rewritten (`@oadt/protocol` → `../protocol/index.js`,
`../../shared/` → `../shared/`). Deliberate changes, each marked
`Portfolio patch` in the source:

- `office/render.ts`: `RenderState.transparent` skips the backdrop and vignette
  so the hero shows through, and tints night only over what is drawn (a
  `multiply` pass would paint the empty canvas).
- `shared/buddy.ts`: the DOM avatar stylesheets are not imported; the canvas
  office does not use them.

The upstream office's HUD, sidebar and settings (`office/index.ts`) are not
copied. `../engine.ts` is the hero's own small mount, and `../simulation.ts` is
a scripted session modelled on upstream's `packages/core/src/sources/demo.ts`.
To update, copy the files again, reapply the patches, and run `npm run build`.
