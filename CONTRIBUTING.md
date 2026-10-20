# Contributing drill modals

Drills are independent small websites in [`drill-modals/`](drill-modals/README.md), one folder per drill, alongside shared `helpers/` and `styles/`. Own your HTML, CSS and JavaScript; no framework, slots, or component inheritance is required.

## Add a drill

1. Add `drill-modals/<your-id>/index.html`, `style.css`, `app.js`, `logic.js`, `drill.json`, and `tests/*.cjs`. Other file organizations inside your folder are fine.
2. Register `<your-id>/drill.json` in `drill-modals/catalog.json`.
3. Declare English metadata, `labels`, `defaultParams`, `parameters`, `features`, and named `examples` in the manifest. Include `../helpers/client.js` in the page and implement `Drill.onStart((params, context) => …)`.
4. Emit `Drill.complete({outcome, method, itemId, attempts, details})` or `Drill.cancel()`. The host normalizes the output for the game. Register media/timer cleanup using `Drill.onDispose`.
5. Run `npm run test:drill -- <your-id>`. Add unit tests for content/answer logic and UI tests for completion, failure/retry, cancellation and cleanup where relevant.
6. Run `npm start`, then open `/drills/?drill=<your-id>`. Change the generated controls and inspect the output. Include a runner link or example parameters in your contribution.
7. Run `npm test` and `npm run build`. Registering a drill makes it available to the runner; connect game encounters explicitly.

The [drill README](drill-modals/README.md) defines the input/output API, URL parameters, test commands, and example payloads. [Hebrew reading](drill-modals/word-reading/README.md) and [arithmetic](drill-modals/math/README.md) are real working examples.

## Metadata

Use [the Hebrew manifest](drill-modals/word-reading/drill.json) as an example. Declare `subject`, BCP 47 `language`, `direction`, `skills`, English letter identifiers in `letters`, and optional `tags`/`groups` arrays. `difficulty` needs a numeric level within a named scale and a concrete explanation. `proficiency` needs a named rubric and prerequisites. `gameLevels` is separate from learning difficulty. Additional metadata is welcome; group names are unrestricted.

Declare browser `capabilities`, result methods in `assessment`, and honest success criteria. Do not label transcript matching as pronunciation assessment. The reading word count, lengths, and English letter inventory are tested against its content file. Metadata and filenames must contain no Hebrew characters. Keep Hebrew words and localized UI in content and display files, not manifests. Use BCP 47 tags such as `he-IL` for language. Descriptive English drill titles and ASCII slugs identify contributions; `aliases` preserve older IDs. Keep declared examples valid and covered by your tests.

### Defaults and owned features

The v2 manifest keeps defaults in `defaultParams`; parameter schemas declare types, labels and bounds without duplicating defaults. Add discoverability `labels` such as `math`, `multichoice`, or `chrome`. Labels describe the content or compatibility; use a `compatibility` explanation for caveats such as speech support.

A drill can declare `features` with a title, description, `defaultEnabled`, `defaultParams` and `parameters`. The control center generates its nested toggle and fields automatically. The host sends them in `params.features.<featureId>`, including `enabled`. Validate types and limits through `DrillContract`; unknown feature names and parameters are rejected. New features still require implementation inside the drill. Game integrations explicitly choose which settings apply to encounters.

`npm start`, `npm test`, and `npm run build` generate `drill-modals/registry.js` from the manifests. Do not edit the registry by hand. Restart the server after changing manifests. Runtime code reads this generated registry; the JSON is the single source of defaults.

## Small HTML/CSS/JS guardrails

- Use responsive HTML, correct `lang`/`dir`, labeled controls, visible keyboard focus, reduced-motion support, and feedback that does not depend only on color.
- Each drill gets an iframe to isolate styles and IDs. Shared `styles/host.css` supplies the outer dialog and backdrop. All inner layout is yours. Game challenges have no exit button; the standalone runner opts into test cancellation.
- Keep scripts/assets local, avoid inline JavaScript, `eval`, trackers, and undeclared remote dependencies. Copy an example's CSP. The host's result messages never accept game scores or powers.
- Request microphone access only on a user click. Allow retries and an alternative input (such as adult confirmation) when it fails. Keep recordings and transcripts out of outputs; use stable content IDs and result methods instead.
- Use the bridge, not `parent.document` or game globals. Stop media/timers when disposed. The host validates source, origin, session and one-time completion, and removes the frame on close.
- Review contributed JavaScript before merging. Frames use `allow-scripts allow-same-origin allow-forms` for browser speech and local form controls; the example CSP blocks network form submissions; this isolates layout but is not a security boundary for hostile code. Arbitrary uploaded code is not supported.

## One challenge per modal

- Fit the complete interaction into the frame without scrolling. Check desktop, narrow mobile (320 × 568) and landscape (844 × 390), including hints and retry feedback. Adapt spacing and layout; do not hide required controls with overflow clipping.
- Present one assigned item. Keep word selection, filters and next-drill navigation in the launcher or game, outside the drill.
- After brief success feedback, call `Drill.complete(...)` automatically, exactly once. Do not require a Finish, Continue or Return button. Cancel pending completion and media in `Drill.onDispose`.
- The host defaults to `dismissible: false`. Only the standalone runner opts into `dismissible: true` for Escape cancellation, with a small keyboard hint. Neither mode adds exit buttons. Programmatic host cancellation remains available.

## Review checklist

Run the drill's own tests, the whole suite, and the build. Manually try configured inputs, success, a wrong answer, retry, cancellation, reopening, missing browser capabilities, and a narrow viewport. Check the output JSON and verify that the game grants a reward once. Browser speech accuracy requires real manual testing and is not established by mocked recognition tests.
