# SRD 5.2.1 magic item catalog

`srd-5.2.1-magic-items.json` is an optional, import-ready list for Hacsi's magic shops. It is not bundled as starter inventory, imported into any user's ledger, or uploaded to Firestore automatically.

## Source and license

This catalog adapts the *System Reference Document 5.2.1* by Wizards of the Coast LLC, licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). The [official SRD and download](https://www.dndbeyond.com/srd) contain the complete English rules. The catalog keeps English item names and provides original, abbreviated English effect summaries. It does not reproduce the full item descriptions. Category labels are translated to match this app's nine item types, and the value suggestions are calculated for this app.

The 258 alphabetic SRD headings produce 317 records because entries whose rarity varies are split into named variants. For example, the three enhancement levels of a magic weapon have separate records. `sourcePage` refers to the page printed in the SRD 5.2.1 PDF. The admin-only SRD base-catalog uploader retains `id`, `sourcePage`, and `requiresAttunement`. The personal JSON importer only imports the standard item fields.

## Prices

The `price` field is a starting value in GP, not a fixed selling price. It follows the SRD's rarity values (100 / 400 / 4,000 / 40,000 / 200,000 GP; artifacts have no price). Potions and explicitly single-use items use half that value. A piece of magic ammunition uses one twentieth of its rarity value because the SRD values ten pieces like one potion of the same rarity. Spell Scroll values are twice the SRD scribing cost for the relevant spell level. The base cost of a particular mundane weapon or armor is not included where the item can take multiple forms; add it in the shop price when relevant.

The summaries are aids for catalog browsing and live play. Consult the cited SRD page for complete mechanics, including charges, DCs, attunement restrictions, and exceptional effects.
