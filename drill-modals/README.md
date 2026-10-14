# Standalone drill modals

Every drill owns its HTML, CSS, JavaScript, metadata, and tests. Shared code only handles discovery, validated inputs, the game bridge, and the optional visual shell.

```text
drill-modals/
  hebrew-reading/
    index.html, style.css, app.js, logic.js, words.js
    drill.json
    tests/logic.cjs, tests/ui.cjs
  arithmetic/
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
  styles/          # shared shell, arithmetic, and runner styles
  runner/          # manual test harness
  index.html       # runner entry
  catalog.json     # registered drill manifests
```

From the repository root:

```sh
npm start
npm run test:drill -- hebrew-reading
npm run test:drill -- arithmetic
npm test
npm run build
```

The development server maps `/drills/` directly to this folder, so edits appear after a reload. The build copies runtime files into `build/drills/`; it excludes tests, test fixtures, and Markdown. Do not edit the generated build.

## Explore a drill manually

Open `http://127.0.0.1:8765/drills/?drill=hebrew-reading`. Select an example or edit its JSON parameters, then choose **Run drill**. Complete or cancel it to inspect the normalized output. You can rerun without restarting the game or server.

To open a specific configuration immediately, use `drill`, URL-encoded JSON `params`, and `run=1`:

```text
/drills/?drill=arithmetic&params=%7B%22a%22%3A6%2C%22b%22%3A8%2C%22operation%22%3A%22multiply%22%2C%22answerMode%22%3A%22typed%22%7D&run=1
```

The runner generates an **Open this exact configuration** link. Invalid JSON, unknown parameters, types and bounds are checked before opening. The parameter reference and example configurations come from each drill's manifest, not hardcoded runner forms. Inputs that are valid structurally but invalid for a drill's content (such as a Hebrew word outside its bank) return an error result during initialization.

## Interface used by both games and the runner

Load `helpers/metadata.js`, `helpers/contract.js`, `helpers/host.js` and `styles/host.css` in the host page. Then:

```js
const session = await DrillHost.open('hebrew-reading', {
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
  "drillId": "hebrew-reading",
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

`drill.json` contains a `parameters` map. Each field declares `type`, an optional `default`, `required`, `description`, and optional `enum`, `minimum`, `maximum`, or `maxLength`. Primitive types, arrays and objects are supported; arrays and objects are passed as JSON and their inner shape is the drill's responsibility. Unknown top-level fields are rejected. Total parameters are limited to 8 KB. Use `examples: [{name, params}]` for reproducible cases in the runner.

Extract content selection and answer evaluation into pure functions in the drill's `logic.js`. Unit tests can call those functions directly, without Three.js, a browser, microphone permission, or the rest of the game. UI tests can separately verify retries, result emission and cleanup. Real audio recognition still needs a manual browser check.
