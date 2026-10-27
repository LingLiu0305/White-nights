# PC narrative interaction implementation ledger

Spec: ../design/interaction-iteration-spec.md
Scope: P1 + P2, PC only; no publishing, no new image requests.
User document edits and untracked portrait candidates are preserved.

## Baseline
- 18 unit tests passed. Build passed with existing Three.js chunk warning.
- All 26 baseline browser tests passed.

## Rounds
- [x] 1. Intro, stable paragraph IDs, compatible save data, camera-relative walking.
- [x] 2. Observation, waiting, interleaved letter, place memories.
- [x] 3. Sealed letter, final-night attention, keepsakes and full verification.

## Decisions
- Existing feature branch and working folder retained to preserve the user's live preview and document edits.
- Stable paragraph IDs are assigned explicitly to the existing edition without reordering paragraphs.
- Human playtesting remains pending; automated checks will not be described as a human trial.

Round 1: 21 unit checks, build and 4 targeted browser checks passed. Intro screenshot inspected. Legacy walking test now waits for proximity state rather than wall-clock duration, since hysteresis and software-rendered frames change the exact time. Browser tests run serially to avoid competing WebGL renderers.

Round 2: 25 unit tests and build passed. Chrome checks passed for observation pause/map/reload/replay, waiting, interleaved letter restoration, and complete five-chapter classic reading. Observation, waiting and letter screenshots inspected. Existing reading tests now explicitly skip optional moments or select Read as dialogue, preserving their paragraph-by-paragraph assertions.

## Final review and rulings
- Independent fresh-context review found two important restore defects: completed replays could fail to reopen (and stop the typewriter), and visiting another chapter lost a letter's phase/scroll. Both have reproduced failing unit tests, fixes, and passing unit regression results; browser verification follows.
- Intro's deferred close event could steal focus from a location button. Fixed by restoring canvas focus only if focus has no meaningful destination; focused labels reveal their names.
- Ruling: existing working branch retained, no separate checkout — preserve the live preview and user-owned uncommitted documents/assets. No push or publication.
- Ruling: inline observation response and Escape returning to reading are intentional for the shared optional-event container; there is no nested response modal. Object text remains available from the keyboard-accessible list.
- Ruling: waiting uses selectable observations without per-object camera moves; only the planned fourth-night attention beat reframes the scene. This keeps waiting non-timed and avoids unnecessary motion.
- Ruling: envelope/acceptance actions are immediate explicit state changes, with CSS paper/envelope and a slight hover response; no mandatory opening/transfer animation. No animation callback owns progression.
- Ruling: History retains letter prose; explicit replay is on the event's original paragraph rather than an additional history action. Back supports that entry without automatically blocking rereading.
- Final: minor (deferred): keepsakes currently appear in selection/insertion order, not forced chapter order when chapters are reread out of order.
- Final: minor (deferred): map position is restored, but chapter selection applies the display facing instead of the saved facing.
- P3 and mobile-specific redesign are out of scope. Human playtesting is pending, not replaced by automated checks.

Final verification: `npm test` 29 passed; `npm run build` passed with the existing Three.js chunk-size warning; `npm run test:e2e` 39 passed in Chrome after the distant-figure fix. `git diff --check` passed. Full interactive and classic routes both completed.
