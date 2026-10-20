# Standalone drill modals

Every drill owns its HTML, CSS, JavaScript, metadata, and tests. Shared code only handles discovery, validated inputs, the game bridge, and the optional visual shell.

```text
drill-modals/
  word-reading/
    index.html, style.css, app.js, logic.js, words.js
    drill.json
    tests/logic.cjs, tests/ui.cjs
  math/
    index.html, style.css, app.js, logic.js
    drill.json
    tests/logic.cjs, tests/dialog.cjs
    … optional math UI helpers and presets
  helpers/
    client.js       # API used inside a drill
    host.js         # API used by the game and runner
    contract.js     # input validation and output normalization
    metadata.js    # discovery and tagging
    testing/       # lightweight Node DOM fixture
  styles/          # shared modal shell, math UI, and metadata browser styles
  runner/          # reusable test-link parsing
  index.html       # redirects to the unified /control-center/
  catalog.json     # registered drill manifests
  registry.js      # generated browser metadata; edit drill.json instead
```

From the repository root:

```sh
npm start
npm run test:drill -- word-reading
npm run test:drill -- math
npm test
npm run build
```

The development server maps `/drills/` directly to this folder, so edits appear after a reload. The build copies runtime files into `build/drills/`; it excludes tests, test fixtures, and Markdown. Do not edit the generated build.

## Explore a drill manually

Open `http://127.0.0.1:8765/control-center/?drill=word-reading`. Select an example or edit its parameter controls, then choose **Run drill**. Complete or cancel it to inspect the normalized output. You can rerun without restarting the game or server.

To open a specific configuration immediately, use `drill`, URL-encoded JSON `params`, and `run=1`:

```text
/drills/?drill=math&params=%7B%22a%22%3A6%2C%22b%22%3A8%2C%22operation%22%3A%22multiply%22%2C%22answerMode%22%3A%22typed%22%7D&run=1
```

Use **Copy drill link** to share a reproducible test. The old `/drills/` endpoint and `arithmetic` / `hebrew-reading` IDs continue to resolve. Invalid JSON, unknown parameters, types and bounds are checked before opening. The fields, examples, nested feature switches, and metadata viewer come from the manifest. Inputs that are valid structurally but invalid for a drill's content (such as a Hebrew word outside its bank) return an error result during initialization.

## Interface used by both games and the runner

Load `helpers/metadata.js`, `helpers/contract.js`, `helpers/host.js` and `styles/host.css` in the host page. Then:

```js
const session = await DrillHost.open('word-reading', {
  params: { word: 'דג', wordLength: '2', sound: false },
  context: { gameLevel: 1 }, // Optional game context; not drill configuration.
  onResult(result) {
    // Called once for success, failure, cancellation or a load/runtime error.
    // This is where a game chooses its reward or next action.
    console.log(result);
  },
  onEvent(event) { console.log(event); } // Optional lifecycle diagnostics.
});
// session.close() cancels without awarding anything.
```

`open` rejects load/parameter failures and also reports an error to `onResult`. A second simultaneous `open` is rejected without affecting the first. Convenience callbacks `onComplete`, `onCancel`, and `onFailure` handle success, cancellation, and failure/error respectively. `onFailure` defaults to `onCancel` for existing games. Use either `onResult` or the convenience callbacks to grant rewards; using both for rewards would duplicate your own game action.

Inside a drill:

```js
Drill.onStart((params, context) => {
  // Plain JavaScript; own any HTML or interaction you need.
});
Drill.onDispose(() => { /* stop timers, media, listeners, etc. */ });
Drill.complete({
  outcome: 'success', // or 'failure'
  method: 'speech-transcript', // must be declared in assessment.methods
  itemId: 'דג',
  attempts: 2,
  details: { hintsUsed: 1 } // optional drill-specific JSON
});
// Drill.cancel() reports cancellation instead.
```

The game receives:

```json
{
  "schemaVersion": 1,
  "drillId": "word-reading",
  "outcome": "success",
  "method": "speech-transcript",
  "itemId": "דג",
  "attempts": 2,
  "durationMs": 8200,
  "details": { "hintsUsed": 1 }
}
```

The host assigns the drill ID, schema version, and elapsed time (including frame loading). Cancellation/error results have `outcome`, `reason`, and `durationMs`, without invented answer data. The host checks origin, iframe, session, result method, shape and one-time completion. No score or power is accepted from a drill. Extra result fields are discarded; put optional drill data in `details` (a JSON object up to 4 KB). Never send recordings or transcripts.

## Parameter declarations

`drill.json` uses metadata schema version 2. `defaultParams` contains every parameter’s default value. `parameters` declares `type` (`string`, `integer`, `number`, `boolean`, `array`, `object`), `title`, `description`, and optional `enum`, `minimum`, `maximum`, or `maxLength`. Unknown fields and invalid types/ranges are rejected. Arrays and objects use a JSON field; their inner structure remains the drill’s responsibility. Total resolved parameters are limited to 8 KB. Use `examples: [{name, params}]` for reproducible cases.

Names, paths, labels and all manifest text are English. Hebrew lesson text stays in `word-reading/words.js` and its display files. `letters` uses English names such as `alef` and `final-mem`; `language: "he-IL"` still describes the lesson language. `labels` are searchable, flexible slugs such as `math`, `multichoice`, `chrome`. They do not impose a component layout.

Features belong to their owning drill:

```json
{
  "features": {
    "breathing": {
      "title": "Breathing bonus",
      "description": "Pause responses, then reset the countdown.",
      "defaultEnabled": true,
      "defaultParams": { "durationSeconds": 10 },
      "parameters": { "durationSeconds": { "type": "integer", "minimum": 1, "maximum": 60 } }
    }
  }
}
```

The host resolves this to `params.features.breathing = {enabled: true, durationSeconds: 10}`. Explicit test/game parameters override saved defaults. Shared game links pin feature flags and `dp.<drillId>` JSON; explicit `ff.<drillId>.<featureId>` switches win over pinned parameter values. Active tests keep their inputs until completion. The game applies breathing changes live but lets an already-started pause finish normally.

`npm start`, `npm test`, and `npm run build` regenerate `registry.js`. Restart the development server after editing a manifest. Both game settings and control-center forms consume the same generated data. The original JSON remains authoritative.

Extract content selection and answer evaluation into pure functions in the drill's `logic.js`. Unit tests can call those functions directly, without Three.js, a browser, microphone permission, or the rest of the game. UI tests can separately verify retries, result emission and cleanup. Real audio recognition still needs a manual browser check.
