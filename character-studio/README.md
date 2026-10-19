# Character Studio

An independent image-only playground at `/character-studio/`. No game state, character model, or drill logic is changed.

## Use

Run `npm start` at the repository root and open `/character-studio/`. Choose one of four characters, toggle any combination of six head/eye and six neck/body accessories, then drag or use the labeled controls to adjust each layer. Arrow keys nudge the selected accessory on the focused canvas (Shift for larger steps). Layer order is editable. PNG export is 1024 × 1024; choose the transparent backdrop to preserve alpha. Individual accessories are downloadable via Original PNG, and all originals are listed in the asset catalog.

Looks persist under the separate `moon-rainbow.character-studio.v1` localStorage key. Copy look link embeds the recipe in the URL fragment; it does not upload it. Download look recipe exports the same versioned JSON. Shared links take precedence over local saves.

## Source and assets

- `index.html`, `studio.css`: independent responsive interface.
- `model.js`: DOM-free, validated recipe and placement functions, shared with tests.
- `studio.js`: canvas composition, image loading, alpha-aware pointer hit tests, controls, local save, and export.
- `assets/manifest.json`: 4 character entries and 12 accessory entries with placement metadata.
- `assets/*.png`: 16 original transparent images produced using the built-in image-generation tool. Source originals are preserved, not flattened into compositions.
- `assets/prompts.json`: the complete prompt used for each generated asset.
- `../tests/character-studio.cjs`: asset and model-contract checks, run with `npm test`.

## Add a piece

Save a front-facing transparent PNG in `assets/`, add a unique catalog ID and relative `src`, and choose category `upper` or `lower`. Set `anchor` to `eyes`, `head`, or `neck`; `width` is relative to the character's face width, and `pivot` is the vertical point of attachment (0 = top, 1 = bottom). The renderer uses alpha bounds for accessory sizing without altering the original PNG. Characters have per-design anchors in the 1024px artboard. Update the count checks when deliberately expanding the collection.

The studio uses buildless HTML/CSS/JS. `scripts/build.cjs` copies it beside the game and drills; `scripts/serve.cjs` serves the source directly. No generation service or secret is required by visitors.

### Fit calibration

Each character's optional `fits` map overrides accessory `width`, `pivot`, `heightScale`, `dx`, and `dy`. User adjustments remain relative to these calibrated defaults, so Reset fit restores the corrected placement. `/character-studio/fit-review.html` shows all 48 single-accessory combinations for visual review. The active catalog references revised front-facing scarf/bandana artwork and slimmer headphones; prior images remain available as source history.
