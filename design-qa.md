# Design QA — Kezelés fiók

- Source visual truth: the selected third Product Design mock (not included in the repository).
- Implementation screenshot: [design-qa-management-tablet.png](design-qa-management-tablet.png).
- Full-view comparison: [design-qa-comparison.png](design-qa-comparison.png) (source left, implementation right).
- Viewport and state: 834 × 1194 CSS px, portrait tablet, Rézhold shop selected, Köpeny az oltalomhoz selected, Kezelés open.
- Pixels and normalization: source 1048 × 1501 px resized to 834 × 1194; implementation 834 × 1194 px at browser density 1. No device frame or browser chrome in either comparison.

## Findings

No actionable P0, P1, or P2 mismatch remains. The right drawer occupies the same proportion of the tablet width, uses the existing parchment and merchant illustration, and keeps the three action groups and selected-item sale bar in the same hierarchy as the source.

The five required fidelity surfaces were checked in the combined image:

- Fonts and typography: the existing ledger serif, dark burgundy headings, and compact row copy match the source hierarchy; text remains readable without clipping.
- Spacing and layout: drawer width, header, action row heights, group rhythm, and fixed sale bar closely follow the source. The game view starts its inventory higher because the requested management actions moved into the drawer.
- Colors and tokens: parchment, burgundy ink, warm borders, selected row, and dimmed background use the established palette.
- Images and icons: the existing merchant illustration, parchment asset, and item thumbnails are preserved; Phosphor icons are used for actions.
- Copy and content: all requested shop, catalog, JSON, cloud, random stock, and activity actions are present. Secondary descriptions use the app's actual behavior and counts.

Focused region comparison was not needed: the 1668 × 1194 combined image shows the heading, action labels, icons, and sale controls at readable size.

## Comparison history

1. First tablet comparison: the merchant art was too narrow, group spacing was compressed, and the sale bar was dimmed. The header image was widened, group spacing increased, and the overlay now stops above the inert sale bar.
2. Mobile check: the add button squeezed the search field. Its label becomes “Tárgy” under 560 px, and the shop note moves into the drawer. The 390 × 844 view was recaptured and showed the search, inventory, drawer scroll, and fixed sale bar without clipping.
3. Final tablet comparison: `design-qa-comparison.png` shows the corrected drawer and footer. The remaining differences are minor decorative divider details and more precise action descriptions. These are P3 polish only.

## Interaction checks

- Open and close the drawer, including Escape and focus return to Kezelés.
- Open JSON import from the drawer; the drawer closes and focus moves into the import dialog.
- Expand Felhőszinkron details without signing in.
- Filter inventory, select Bag of Holding, open the selected item's stock adjustment, then cancel without changing stock.
- Fresh production build with an empty catalog opens the drawer at full viewport height when no sale bar exists.
- Browser rendering and primary interactions completed; no browser error was observed during these checks.

Final result: passed
