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

These choose the initial practice configuration; the learner can still use the drill's word selector and length controls. One correct reading followed by the finish button emits a success. The output distinguishes `speech-transcript` from `adult-confirmed`, with item ID, attempt count, word length and hints used. Canceling grants nothing. Speech-service errors do not count as wrong reading attempts. Attempt counts and hints refer to the currently selected word.

Manual checks: wrong word then correct word, denied microphone, hint, adult confirmation, closing during recognition, reopening with another word, and a word-length mismatch. The bridge reports the last case as an initialization error. Transcript matching is not pronunciation scoring.
