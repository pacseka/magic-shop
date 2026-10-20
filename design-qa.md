# Design QA

## Evidence

- Source visual truth: `C:\Users\Hacsi\.codex\generated_images\01a152ef-19e6-7281-81ad-005034ca2a31\exec-3f2e9c16-30dc-4293-9793-3ee0138a370f.png`
- Browser-rendered implementation: `D:\Develop\docker-dashboard-api\magic-shop-prototype\implementation-tablet.jpg`
- Full-view side-by-side comparison: `D:\Develop\docker-dashboard-api\magic-shop-prototype\design-comparison.jpg`
- Focused item-detail comparison: `D:\Develop\docker-dashboard-api\magic-shop-prototype\design-comparison-detail.jpg`
- State: default shop inventory, Köpeny az oltalomhoz selected, no dialog open.
- Browser viewport: 834 × 1194 CSS px, DPR 1. The browser capture excludes a 15 px vertical scrollbar and measures 819 × 1173 physical px. The 1048 × 1536 source was resized to 819 × 1201 and cropped to 819 × 1173 for the comparison. No device frame or browser chrome was included.

## Findings

No actionable P0, P1, or P2 mismatch remains. The inventory, selected item, price control, and sale action retain the source hierarchy and fit in the tablet viewport.

- Fonts and typography: serif display and body text, scale, line height, and wrapping closely follow the source. The source uses a somewhat heavier title face; the current Cormorant Garamond and Georgia pairing is readable at tablet size.
- Spacing and layout rhythm: header, toolbar, five-row inventory, divider, detail, and sale button align with the source's vertical sequence. Touch controls remain visible at 834 × 1194.
- Colors and visual tokens: oxblood actions, warm ivory paper, dark brown text, and subdued borders match the selected direction. Rarity colors intentionally changed where the generated mock had incorrect D&D 2024 rarity labels.
- Image quality and asset fidelity: the header, five item thumbnails, paper texture, and featured cloak are real raster assets in the selected art direction. The cloak background was removed to avoid a visible square. No mock image asset was replaced by a drawn placeholder.
- Copy and content: the key Hungarian labels match the selected design. Item rarity and baseline prices were corrected to the 2024 rules; the effect text was shortened and clarified. These intentional changes preserve the shop workflow.

## Comparison history

1. Initial browser capture: the sale button fell below the tablet viewport, long item names wrapped too often, and the featured cloak had a visible rectangular paper background. Classified P2.
2. Fix: reduced header and list height, widened the item-name column, removed the cloak's raster background, and retested at 834 × 1194. The complete sale control became visible.
3. Later full-view and focused comparisons: added paper texture, softened the header illustration edge, enlarged the detail heading and cloak, and checked the rendered result again. No P0/P1/P2 issue remains.

## Interaction and runtime checks

- Searched for a Bag of Holding and selected it; the detail and price changed correctly.
- Changed sale quantity and price, sold two units, and confirmed stock fell to zero and sale disabled.
- Restocked two units and confirmed the item could be sold again.
- Added a custom item and confirmed it became the selected item. The search clears after adding so the new inventory row is visible.
- Browser console errors: none in the final state.
- Vite production build: passed.

## Follow-up polish

- P3: the featured cloak is slightly narrower than the generated mock, though it retains the same watercolor silhouette and scale priority.
- P3: generated small item paintings have softer detail than the source concept at close zoom.

final result: passed

---

# Shared Catalog and Random Stock QA · 2026-10-20

## Evidence

- Source visual truth: `C:\Users\Hacsi\.codex\generated_images\01a152ef-19e6-7281-81ad-005034ca2a31\exec-3f2e9c16-30dc-4293-9793-3ee0138a370f.png` (1048 × 1536 px).
- Implementation, initial shop and selected cloak: `D:\Develop\magic-shop-prototype\implementation-catalog-tablet.png` (834 × 1194 px, 834 × 1194 CSS viewport, DPR 1).
- New random-stock dialog: `D:\Develop\magic-shop-prototype\implementation-random-tablet.png` (834 × 1194 px, same viewport and density).
- The source and current tablet screenshot were opened together for comparison. The source scales to 834 × 1222 px at equal width; its final 28 px extend beyond the implementation viewport. New shop controls, catalog actions, and the quick-sale strip intentionally occupy space absent from the source. Compare their visual language rather than treating their vertical offset as a fidelity error.
- Focused region: the new random-stock dialog screenshot shows readable labels, form controls, preview rows, and a visible apply action at tablet size. No second crop was needed because the dialog and text were readable in the full viewport capture.

## Findings

No actionable P0, P1, or P2 visual issue remains. The original header art, paper texture, oxblood action color, item illustrations, inventory columns, and selected-item anatomy remain aligned with the chosen merchant-ledger direction. The new controls use the same type, borders, and button treatment.

- Fonts and typography: Cormorant Garamond headings and Georgia body copy remain readable; catalog and random controls fit the tablet modal.
- Spacing and layout: added shop and catalog controls move the details below the first viewport. A compact quick-sale strip immediately after the inventory keeps quantity, editable price, and sale available during live play.
- Colors and tokens: parchment, brown text, subdued borders, and oxblood primary actions match the existing implementation. Rarity colors retain their previously corrected D&D labels.
- Images and assets: the merchant art, item paintings, and parchment texture are unchanged. New icons use the existing Phosphor set.
- Copy and content: Hungarian labels distinguish the shared catalog, shop stock, and randomized preview. Stock replenishment says it adds to existing quantities.

## Comparison history

1. Initial new-feature tablet capture placed the sale controls below the visible 834 × 1194 viewport (P2 for live-play use).
2. Added the quick-sale strip after the inventory. In the new tablet capture, item selection, quantity, editable price, and sale are all visible above the fold.
3. Initial random preview clipped the apply button at the bottom of the dialog (P2). Increased the wide dialog height and made its final actions sticky. The tablet preview now shows the full result and apply button.

## Interaction and runtime checks

- Created a catalog-only item, added it to one shop, created another shop, then added the same catalog item there with that shop's multiplier.
- Rolled and applied random stock; existing item stock increased without duplicate rows. Reloading kept both the catalog and stock.
- Edited the catalog item price and verified the linked shop price changed while stock stayed fixed. The editable sale field now resets to that new base-derived price.
- Browser console errors: none. All 11 Node tests and the Vite build passed; Sites packaging produced the three required files.

final result: passed
