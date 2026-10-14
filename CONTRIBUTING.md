# Contributing drill modals

Drills are independent small websites in [`drill-modals/`](drill-modals/README.md), one folder per drill, alongside shared `helpers/` and `styles/`. Own your HTML, CSS and JavaScript; no framework, slots, or component inheritance is required.

## Add a drill

1. Add `drill-modals/<your-id>/index.html`, `style.css`, `app.js`, `logic.js`, `drill.json`, and `tests/*.cjs`. Other file organizations inside your folder are fine.
2. Register `<your-id>/drill.json` in `drill-modals/catalog.json`.
3. Declare metadata, `parameters`, and named `examples` in the manifest. Include `../helpers/client.js` in the page and implement `Drill.onStart((params, context) => …)`.
4. Emit `Drill.complete({outcome, method, itemId, attempts, details})` or `Drill.cancel()`. The host normalizes the output for the game. Register media/timer cleanup using `Drill.onDispose`.
5. Run `npm run test:drill -- <your-id>`. Add unit tests for content/answer logic and UI tests for completion, failure/retry, cancellation and cleanup where relevant.
6. Run `npm start`, then open `/drills/?drill=<your-id>`. Change the JSON inputs and inspect the output. Include a runner link or example parameters in your contribution.
7. Run `npm test` and `npm run build`. Registering a drill makes it available to the runner; connect game encounters explicitly.

The [drill README](drill-modals/README.md) defines the input/output API, URL parameters, test commands, and example payloads. [Hebrew reading](drill-modals/hebrew-reading/README.md) and [arithmetic](drill-modals/arithmetic/README.md) are real working examples.

## Metadata

Use [the Hebrew manifest](drill-modals/hebrew-reading/drill.json) as an example. Declare `subject`, BCP 47 `language`, `direction`, `skills`, actual `letters`, and optional `tags`/`groups` arrays. `difficulty` needs a numeric level within a named scale and a concrete explanation. `proficiency` needs a named rubric and prerequisites. `gameLevels` is separate from learning difficulty. Additional metadata is welcome; group names are unrestricted.

Declare browser `capabilities`, result methods in `assessment`, and honest success criteria. Do not label transcript matching as pronunciation assessment. The Hebrew word/letter inventory is tested against the actual content. Keep declared examples valid and covered by your tests.

## Small HTML/CSS/JS guardrails

- Use responsive HTML, correct `lang`/`dir`, labeled controls, visible keyboard focus, reduced-motion support, and feedback that does not depend only on color.
- Each drill gets an iframe to isolate styles and IDs. Shared `styles/host.css` supplies the outer dialog, backdrop and close button. All inner layout is yours.
- Keep scripts/assets local, avoid inline JavaScript, `eval`, trackers, and undeclared remote dependencies. Copy an example's CSP. The host's result messages never accept game scores or powers.
- Request microphone access only on a user click. Allow retries and closing when it fails. Keep recordings and transcripts out of outputs; use stable content IDs and result methods instead.
- Use the bridge, not `parent.document` or game globals. Stop media/timers when disposed. The host validates source, origin, session and one-time completion, and removes the frame on close.
- Review contributed JavaScript before merging. Frames use `allow-scripts allow-same-origin allow-forms` for browser speech and local form controls; the example CSP blocks network form submissions; this isolates layout but is not a security boundary for hostile code. Arbitrary uploaded code is not supported.

## Review checklist

Run the drill's own tests, the whole suite, and the build. Manually try configured inputs, success, a wrong answer, retry, cancellation, reopening, missing browser capabilities, and a narrow viewport. Check the output JSON and verify that the game grants a reward once. Browser speech accuracy requires real manual testing and is not established by mocked recognition tests.
