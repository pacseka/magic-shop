# Hacsi's magic shops Instructions

The project's display name is **Hacsi's magic shops**. Use `hacsi-magic-shops` where a package-safe identifier is required.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

The user chose the first generated visual direction, a warm parchment merchant ledger, for a D&D 5.5 magic-shop app used primarily on a tablet. Preserve that visual direction and prioritize quick inventory selection, editable sale price, and stock changes during live play.
For live play, the user selected the third tablet design for a right-side parchment “Kezelés” drawer. Keep shop, shared catalog, JSON, cloud, random stock, and activity management in that drawer so search and inventory start higher on the game screen. Preserve the fixed sale bar and its quick stock and price controls.

For magic-item creation and editing, the user chose the first full-page parchment editor concept: show the item image beside compact core fields, keep description fields together, put image choices behind “Kép cseréje,” and keep save actions visible without scrolling the entire dialog.

Keep new-shop and shop-editing forms short at tablet size. Put essential shop fields on an immediately visible first section, optional relationship and adventure notes on a second section, and keep save actions visible while switching sections.

Keep the selected item's sale bar visible at the bottom on every screen size. Clicking its name should reveal the item's description and effect. A price edited from a shop belongs to that shop's item only; preserve the shop multiplier and the shared catalog base price.
Edit the persistent shop price on the shop item's detail card with an explicit save action. A price entered during a sale applies only to that sale and must never change the item's shop price.
Keep a per-shop record of sales and stock changes. Let the user undo the latest recorded stock action, and make manual stock additions and reductions quick from the selected item's sale bar.
Allow removing an item entirely from one shop's inventory while keeping its shared catalog definition and other shops' stock. Offer removal from the item's details, confirm the affected item and stock, record it in that shop's activity, and support undo with the original stock and shop price.

The user wants multiple named shops with location, owner, description, a multiplier applied to each item's base price, and useful relationship/adventure notes. Shop and item data should persist with Firebase when configured, remain usable locally before setup or during an outage, and be exportable as JSON.

Shops must be deletable from the management drawer. Confirm the affected shop, inventory, and activity before removing it from the active local or cloud dataset. Preserve the shared item catalog and all other shops. Allow deleting the last shop, show a create-shop empty state, and preserve an explicitly empty shop list across reloads instead of recreating starter or legacy shops.

Keep the management drawer open behind dialogs launched from it, and return focus to the triggering menu action when a dialog closes. Show the local/cloud data controls in a dialog like the other management actions, and place the shop notes inside the Bolt section of the drawer.

Cloud/local behavior selected on 2026-10-22: signed-in users use cloud data; signed-out users use separate local data. While signed in, users can explicitly copy cloud data to the local dataset or upload the local dataset to the cloud. Copying cloud data locally must not switch the active source away from the cloud. These explicit transfers replace the complete target ledger without conflict detection or merging; confirm the target and retain a restorable backup. Keep these controls in the management drawer and visibly identify the active data source. A signed-in account's offline cache and pending edits must be isolated from the signed-out local dataset and from other accounts. Reconnect uploads pending changes; without a cloud cache, a failed load must not silently display or edit the signed-out local dataset. A new cloud account starts empty and never automatically imports local stock. Sign-out returns to the local dataset without automatic copying.

The user wants a shared magic-item catalog: items can be created centrally and added to any shop, and every item created in a shop must also enter the shared catalog. Shops should support random inventory generation based on local magic prevalence and practical shop factors such as size, rarity limit, and specialty, with a preview before applying it. Keep each shop's stock independent.

The user also wants an owner-managed Firestore base catalog of roughly 200–300 magic items, readable by signed-in users. Users should be able to explicitly copy items from it into their own personal catalog. Each imported item is an independent, editable, one-time copy; later changes to the base catalog must not update personal copies. Keep this global base catalog distinct from each user's existing catalog and shop stock.
Use `baseCatalog/{itemId}` for that global list and a Console-created `catalogAdmins/{uid}` marker to grant owner writes; clients must not be able to create admin markers. The owner can manage the list in the existing app, without a separate admin app.
Build the initial base catalog from the official D&D SRD 5.2.1 magic items. Preserve the official English item names and use English descriptions/effect summaries; do not add Hungarian descriptions to these records.

Magic items use the nine D&D 2024 magic-item categories. Creating or editing an item should offer an illustrated default image for each category and a custom image URL, with bundled defaults kept in `public/assets` and only the selected path or URL in saved data. Suggest base prices from the D&D 2024 rarity table when rarity changes, keep the amount editable, account for consumable potions, and treat artifacts as priceless by default.

The shared magic-item catalog should accept machine-readable JSON import from a file or pasted text. Accept a single item, an array, or the catalog from the app's JSON export; preview valid entries, duplicates, and errors before applying. Import catalog definitions without changing any shop's stock.

Example magic items are development-only starter data. A fresh production install must start with an empty catalog and shop inventory, and deployment must not overwrite or delete already saved local or Firebase data.

The user wants this repository published at its GitHub Pages project URL through GitHub Actions, without a custom domain. Keep the existing local and Sites builds working alongside the Pages build.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable project-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local app can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
