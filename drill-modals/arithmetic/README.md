# Arithmetic

An independently runnable arithmetic drill using the game's optional math UI. The game continues to own encounter-specific generation, timers and powers; the runner adapter provides explicit inputs for testing this UI separately.

Run only its tests: `npm run test:drill -- arithmetic` (from the repo root).

Manual runner: `/drills/?drill=arithmetic`.

```json
{"a":6,"b":8,"operation":"multiply","answerMode":"typed","seconds":0}
```

Operations: `add`, `subtract`, `multiply`. Modes: `choice`, `typed`. Operands: integers 0–100. Time limit: 0 (untimed) or 1–300 seconds. Explicit parameters make each question reproducible. Retry wrong answers; after 800 ms of feedback, automatically return success or timer-expired failure. There is no finish/continue button. Test cancellation is available in the standalone runner.

The result method is `answer`; the stable item ID identifies operation and operands. It includes attempt count and mode/operation details. Try a wrong answer before the right one, negative subtraction, typed entry, cancellation, and the five-second timer example.
