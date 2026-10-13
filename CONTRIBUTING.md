# Contributing freestyle drills

A drill owns its HTML, CSS, JavaScript, interaction, and learning task. No slots, base class, or component framework is required. Use the existing Hebrew reading drill as a complete example.

1. Add `dist/drills/<your-id>/index.html`, scripts/styles, and `drill.json`.
2. Add `<your-id>/drill.json` to `dist/drills/catalog.json`.
3. Include `../shared/client.js` in your HTML. Call `Drill.onStart(context => …)` for optional game context; call `Drill.complete({outcome:'success', method:'your-declared-method', itemId:'item-id'})` when the learner completes the task. `Drill.cancel()` closes without a reward.
4. Register cleanup with `Drill.onDispose(() => …)`: stop speech, audio, timers, streams and outstanding work. The host also removes the frame on close.
5. Run `npm test`, then use `/drills/` to try the drill and inspect/filter its metadata. Connect it to an encounter explicitly in the game; catalog registration alone does not change gameplay.

## Metadata

See [the actual Hebrew manifest](dist/drills/hebrew-reading/drill.json) and [the validator](dist/drills/shared/metadata.js).

| Field | Meaning |
| --- | --- |
| `schemaVersion`, `id`, `title`, `entry` | Contract version, unique slug, visible title, local HTML entry |
| `subject`, `language`, `direction` | Learning subject, BCP 47 language such as `he-IL`, RTL/LTR |
| `difficulty` | Numeric level **within a named scale**, plus a concrete explanation |
| `proficiency` | Named rubric, proficiency value, and explanation of prerequisites |
| `skills`, `letters` | Specific skills and letters actually covered, including final forms |
| `content` | Drill-specific details: word bank, lengths, niqqud, etc. Free to extend |
| `gameLevels` | Where the game may use the drill; separate from learning difficulty |
| `tags`, `groups` | Optional membership in any number of groups; arbitrary strings, no fixed hierarchy |
| `capabilities` | Browser features requested: currently microphone and speech synthesis |
| `assessment` | Accepted result methods and an honest description of success |

Keep `tags` and `groups` as empty arrays if unused. Additional metadata is welcome. Letter lists and word lengths in the Hebrew example are checked against its real word bank by tests. Its proficiency is a descriptive local early-literacy rubric, not CEFR or a school-grade equivalence. Do not label transcript matching as pronunciation assessment.

## Small guardrails

- Use responsive HTML, visible keyboard focus, labeled controls, the right `lang`/`dir`, reduced-motion support, and feedback that does not rely only on color.
- Each drill runs in its own iframe, so styles and IDs cannot accidentally change the game. The outer dialog supplies a consistent border, backdrop, close button and keyboard dismissal. Inside, use whatever layout fits the exercise.
- Keep scripts/assets local, avoid inline JavaScript, `eval`, trackers, and new remote dependencies. The example's CSP allows local scripts, local/inline styles and local images; network fetches and form submissions are blocked. Browser-provided speech services may still use a remote service.
- Request microphone access only after a user clicks. Provide a clear retry/cancel path if it fails. The Hebrew example also offers explicit adult confirmation; that method is reported separately from speech recognition.
- Use the bridge, not `parent.document` or game globals. Never mutate scores, friends, or powers. The host validates message source, origin, session, declared assessment method and one-time completion. The game grants the reward.
- Review contributed JavaScript before merging. Frames use `allow-scripts allow-same-origin` for browser speech support; this isolates layout but **is not a security boundary for hostile code**. Arbitrary uploaded code is not supported.
- Keep recordings and transcripts out of completion messages. Send only a stable item ID and result method. This example stores no recordings or results.

## Existing math dialogs

The arithmetic UI lives in `dist/dialogs/` and remains available as an optional implementation. Its reusable parts are not the contribution contract. A new drill can ignore it entirely, just as Hebrew reading does.

## Review checklist

Try success, a wrong answer, retry, cancel, reopening, denied microphone, and a narrow viewport. Verify that a friend is rewarded once, that cancellation leaves it available, and that no media continues after closing. Run the automated suite. Real microphone/transcription behavior needs a manual check in a supported browser; the test suite does not simulate speech accuracy.
