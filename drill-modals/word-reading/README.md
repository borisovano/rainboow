# Hebrew reading

An adaptation of `hebrew-reading-lab`, with its own HTML, CSS, word bank, and speech interaction. All four worlds use this drill for friends and progression locks. Class controls word length independently of world: א׳ = 2, ב׳ = 3, ג׳ = 4, ד׳ = 5 letters. This is a game difficulty setting, not a validated school reading standard.

Run only its tests: `npm run test:drill -- word-reading` (from the repo root).

Manual runner: `/drills/?drill=word-reading`.

```json
{"word":"כלב","wordLength":"3","sound":false,"allowAdultConfirmation":true}
```

- `word`: optional exact word, pointed or unpointed, from the filtered bank.
- `grade`: class 1–4, default 1.
- `wordLength`: `grade` (default), `all`, `2`, `3`, `4`, or `5`. Explicit lengths override class for standalone exploration.
- `wordIndex`: starting index, wrapping within that bank; an explicit word overrides it.
- `sound`: optional success/retry sounds. Letter playback remains an explicit learner action.
- `allowAdultConfirmation`: show the explicit adult-confirmation fallback.

These select the single word for this invocation. Word selection and length filters live in the launcher, not inside the drill. A correct reading shows feedback for 800 ms, then automatically emits success. No next-word, finish or return button is shown. The output distinguishes `speech-transcript` from `adult-confirmed`, with item ID, attempt count, word length and hints used. Adult confirmation requires an explicit checkbox and confirmation action. Speech-service errors do not count as wrong reading attempts. Disposal cancels media and any pending result. The compact layout adapts to portrait and landscape frames without scrolling.

Speech matching accepts the common full-spelling variants `עיפרון` → `עפרון` and `מטרייה` → `מטריה`. Difficulty counts the letters in the displayed pointed word, not the speech service's spelling. Whole phrases still do not count as a one-word answer.

The canonical ID is `word-reading`, with English metadata title **Hebrew Word Reading**. `hebrew-reading` remains an alias. Hebrew lesson words are kept in `words.js`; manifests use English letter identifiers and index-based examples.
