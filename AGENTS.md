# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

The user chose the first generated visual direction, a warm parchment merchant ledger, for a D&D 5.5 magic-shop app used primarily on a tablet. Preserve that visual direction and prioritize quick inventory selection, editable sale price, and stock changes during live play.

The user wants multiple named shops with location, owner, description, a multiplier applied to each item's base price, and useful relationship/adventure notes. Shop and item data should persist with Firebase when configured, remain usable locally before setup or during an outage, and be exportable as JSON.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
