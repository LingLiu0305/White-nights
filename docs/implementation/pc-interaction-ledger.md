# PC narrative interaction implementation ledger

Spec: ../design/interaction-iteration-spec.md
Scope: P1 + P2, PC only; no publishing, no new image requests.
User document edits and untracked portrait candidates are preserved.

## Baseline
- 18 unit tests passed. Build passed with existing Three.js chunk warning.
- All 26 baseline browser tests passed.

## Rounds
- [x] 1. Intro, stable paragraph IDs, compatible save data, camera-relative walking.
- [ ] 2. Observation, waiting, interleaved letter, place memories.
- [ ] 3. Sealed letter, final-night attention, keepsakes and full verification.

## Decisions
- Existing feature branch and working folder retained to preserve the user's live preview and document edits.
- Stable paragraph IDs are assigned explicitly to the existing edition without reordering paragraphs.
- Human playtesting remains pending; automated checks will not be described as a human trial.

Round 1: 21 unit checks, build and 4 targeted browser checks passed. Intro screenshot inspected. Legacy walking test now waits for proximity state rather than wall-clock duration, since hysteresis and software-rendered frames change the exact time. Browser tests run serially to avoid competing WebGL renderers.
