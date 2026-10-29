# PC interaction verification — 27 October 2026

Scope: the approved P1 + P2 plan, desktop keyboard/mouse, English narrative and fixed ending. No new image generation, hosting or remote push.

## Results

Final run: `npm test` passed 29 tests; `npm run test:e2e` passed 39 Chrome tests; `npm run build` passed with the existing Three.js chunk-size warning.

## Checks

| Area | Evidence |
| --- | --- |
| Story and saves | Node tests for IDs, legacy cursors, malformed data, blocked storage, chapter locks and reset |
| Walking | Normalization, 30/60/120 fps distance, paving collisions, bridge routing, camera direction and proximity hysteresis tests; Chrome arrow/Enter flow |
| Intro | New reader, returning save, replay from About and Restart browser checks |
| Observation and waiting | Choose objects, pause, Map, reload, explicit replay and skip; third-night next paragraph remains 10 |
| Morning letter | Envelope/paper restore, paragraphs 3–4 then reaction 5 then letter 6 then narration 7; classic dialogue alternative and history |
| Detours and replay | Regressions for an open letter across chapter detours and completed replay restored under ordinary motion |
| Key actions | Duplicate acceptance advances once; distant figure is a real SVG button; looked state restores |
| Memories | One passage per completed chapter, replacement and reload; five-chapter collection; New memory cleared on inspection |
| Failure paths | Missing images, unavailable WebGL, context loss, storage denied and music failure retain reading access |
| Full routes | Original paragraph-by-paragraph route with optional events skipped; complete interactive route through all five endings |
| Layout | Observation and letter at 1280×720, 1440×900, 1920×1080 and 1024×768; 640×360 effective viewport checks 1280×720 layout at 200% zoom |

The 200% check simulates the CSS layout space; browser toolbar zoom itself was not automated. Existing narrow-screen tests remain as regression coverage, not a new mobile support claim. Chrome uses software WebGL in automated runs; this is not a frame-rate benchmark for the user's hardware.

## Screenshots

- [Intro](../screenshots/pc-intro.png)
- [City](../screenshots/pc-city.png)
- [Observation](../screenshots/pc-observation.png)
- [Waiting](../screenshots/pc-waiting.png)
- [Morning letter](../screenshots/pc-letter.png)
- [Footsteps](../screenshots/pc-footsteps.png)
- [Chapter keepsake](../screenshots/pc-keepsake.png)
- [Your memories](../screenshots/pc-memories.png)
- Layout captures: `../screenshots/pc-observe-{640,1024,1280,1440,1920}.png` and `pc-letter-{640,1024,1280,1440,1920}.png`.

## Review and limits

One independent code-review agent examined state recovery, input ownership and optional story routes. Its two important findings were reproduced and corrected: interrupted replay restoration and letter phase/scroll persistence across chapter detours. Screenshot review also caught a missing SVG in the distant-figure control; its browser regression now verifies and clicks the rendered silhouette.

Two minor review findings remain recorded in the ledger: selection-order memories after out-of-order rereading, and resetting the map figure's facing when selecting a chapter. Position and story progress remain preserved. The scope rulings for inline observation feedback, immediate envelope actions and replay entry are in the [ledger](pc-interaction-ledger.md).

Human trial remains pending. No automated or AI review is represented as the assignment's independent user test.
