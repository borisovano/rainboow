# Hebrew reading

An adaptation of `hebrew-reading-lab`, with its own HTML, CSS, word bank, and speech interaction. Game level 1 friends use this drill.

Run only its tests: `npm run test:drill -- hebrew-reading` (from the repo root).

Manual runner: `/drills/?drill=hebrew-reading`.

```json
{"word":"כלב","wordLength":"3","sound":false,"allowAdultConfirmation":true}
```

- `word`: optional exact word, pointed or unpointed, from the filtered bank.
- `wordLength`: `all`, `2`, or `3`.
- `wordIndex`: starting index, wrapping within that bank; an explicit word overrides it.
- `sound`: optional success/retry sounds. Letter playback remains an explicit learner action.
- `allowAdultConfirmation`: show the explicit adult-confirmation fallback.

These select the single word for this invocation. Word selection and length filters live in the launcher, not inside the drill. A correct reading shows feedback for 800 ms, then automatically emits success. No next-word, finish or return button is shown. The output distinguishes `speech-transcript` from `adult-confirmed`, with item ID, attempt count, word length and hints used. Adult confirmation requires an explicit checkbox and confirmation action. Speech-service errors do not count as wrong reading attempts. Disposal cancels media and any pending result. The compact layout adapts to portrait and landscape frames without scrolling.
