# Math Challenge

An independently runnable arithmetic drill using the game's optional math UI. The game continues to own encounter-specific generation, timers and powers; the runner adapter provides explicit inputs for testing this UI separately.

Run only its tests: `npm run test:drill -- math` (from the repo root).

Manual runner: `/drills/?drill=math`.

```json
{"a":6,"b":8,"operation":"multiply","answerMode":"typed","seconds":0}
```

Operations: `add`, `subtract`, `multiply`. Modes: `choice`, `typed`. Operands: integers 0–100. Time limit: 0 (untimed) or 1–300 seconds. Explicit parameters make each question reproducible. Retry wrong answers; after 800 ms of feedback, automatically return success or timer-expired failure. There is no finish/continue button. Test cancellation is available in the standalone runner.

The result method is `answer`; the stable item ID identifies operation and operands. It includes attempt count and mode/operation details. Try a wrong answer before the right one, negative subtraction, typed entry, cancellation, and the five-second timer example.

Both answer modes include an optional breathing bonus: breathing guidance for ten seconds by default covers only the response area, leaving the equation visible. The countdown pauses and then restarts at the configured `seconds`; attempts are preserved and untimed drills stay untimed. Cancelling a drill also cancels the pending bonus.

For custom hosts, pass `breathing: { onRequest(dialog) { /* host-owned timing */ } }` to `createDialog`. Use `dialog.setCover(true)` to block responses, then `setCover(false).setTimer(fullSeconds).focusAnswer()` to resume. The component owns input blocking; the host owns timing and game state. Try the “Optional breathing bonus” example at `/drills/math/playground.html`.

Configure `features.breathing.enabled` and `features.breathing.durationSeconds` in `/control-center/?drill=math`. Defaults live in `drill.json`, with a 10-second pause and a 1–60 second range. `math.breathing` is also a game feature flag. The old `arithmetic` ID remains an alias.
