# Product Prototype

- OpenDesign owns this single root prototype and planning artifacts. Keep canonical React TypeScript source in `src/**`, centered on `src/App.tsx` and the `src/main.tsx` entry. Split files only when needed within this prototype.
- Update source and owner-confirmed `request.md` together. `PRODUCT.md` supplies context; confirmed Request supplies product intent. Recheck all affected Changes when shared routes or scenarios change.
- Import shared implementations directly through public `@cfreact-template/ui` subpaths. Use fixtures and local state, without actual API or database access. Apply the repository's React Compiler rules.
- From the repository root, run `pnpm build:mockup` after source changes. Vite uses the existing shared UI Tailwind CSS 4 and React Compiler configuration to emit one IIFE `dist/prototype.js` and `dist/prototype.css`. Keep both outputs version-controlled and rebuild them rather than editing them manually.
- Keep `index.html` as the stable entry with relative `./dist/prototype.js` and `./dist/prototype.css` references. The agent runs the build with Node.js and repository dependencies; OpenDesign's built-in Prototype Preview opens `mockups/index.html` as a normal static artifact.
- Current routes are `#/` (Home) and `#/users` (Users). Select `?scenario=default`, `empty-users`, `users-loading`, `users-error`, or `create-error` before the hash. Check relevant states at desktop and mobile widths.
- Request's `UI Mock References` uses exact references such as `mockups/index.html?scenario=default#/` and `mockups/index.html?scenario=users-error#/users`. Proposal's `Design Source` uses the same references with adopted screen/flow/state scope and owner adoption evidence.
- Routes, scenarios, and Changes have a many-to-many relationship. Keep root `mockups/` when Changes are archived. Existing Storybook remains the shared UI catalog.
- After Planning Ready, production implementation follows `PRODUCTION_UI -> WIRING -> POLISH -> REVIEW` in app/UI source. Production imports neither prototype source nor `dist`; OpenDesign retains prototype and planning ownership.
