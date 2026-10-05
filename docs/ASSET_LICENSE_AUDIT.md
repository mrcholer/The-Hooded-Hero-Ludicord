# Asset provenance audit

The original MIT code license is preserved verbatim. Upstream did not include an asset-by-asset source/license manifest. Permission is not inferred solely from a file being in that repository.

| Group | Evidence and status |
| --- | --- |
| Acme-Regular.ttf | Embedded metadata identifies Juan Pablo del Peral, reserved name Acme and SIL OFL 1.1. The [Google Fonts Acme notice](https://github.com/google/fonts/blob/main/ofl/acme/OFL.txt) is included at `public/assets/text/OFL.txt`. Font bytes were not changed. |
| Heroes, enemies, UI, tiles, backgrounds and logos | Retained from Tandid/The-Hooded-Hero-V2. Individual authors/packs/redistribution terms were not established upstream. Provenance unverified. |
| Music and effects | Converted from upstream WAV with ffmpeg `libvorbis`, quality 5. Composers/packs and redistribution terms remain unverified. Encoding conversion does not resolve licensing. |
| Maps and supporting data | Upstream README credits original game/level design, but individual data/tileset licenses were not separately established. |

[ASSET_MANIFEST.json](ASSET_MANIFEST.json) inventories every current asset with byte count, SHA-256, category, attribution and license status. It is an inventory, not a license grant: 229 PNGs, 24 OGGs, one TTF, six JSON files and two other files, about 45.4 MB total.

The upstream repository declares MIT licensing, and this adaptation preserves its source history, code license and font notice. The [attribution and reuse record](ATTRIBUTION.md) documents the verified repository permission. Publishing a credited fork does not resolve every third-party provenance gap or establish new ownership of the original assets. Establish the original pack/source terms before unrelated redistribution or asset-specific reuse; this audit does not represent those groups as independently cleared.
