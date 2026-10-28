# White Nights — second interaction iteration

> Implement inline, verify in a real browser, and preserve existing work and save data.

**Goal:** Give the reader more ways to listen to Nastenka and explore her memories without changing the novel's fixed events or ending.

**Architecture:** Continue using the existing stable paragraph IDs, state reducer and DOM interactions. A short response choice is an optional event after Second Night paragraph 18. Two memory scenes open from their related paragraphs and use existing illustrations. Choices and memory observations save locally; neither is required to progress. Existing saves never lose progress.

**Technology:** JavaScript, Three.js, Vite, existing art, CSS/DOM, Node tests and Playwright. PC keyboard/mouse; no external services required.

## 1. Choose how to listen

- [x] At `night-2-p018`, after the typewriter is complete and Next is pressed, offer `Listen quietly` and `Ask about her childhood`, with an explanation that the choice changes the immediate response only.
- [x] Show a distinct, short English response for each choice, then Continue advances to existing `night-2-p019`. Also provide a way to continue without choosing. No timer, scores, relationship changes or ending changes.
- [x] Store the choice and reveal it in History only after it has been selected. Reload, Map, Escape and duplicate clicks must not skip or replay paragraphs. Existing completed chapters and cursors past the anchor must not retroactively interrupt readers.

## 2. Explore her memories

- [x] After `night-2-p019` and `night-2-p027` are visible, show an optional `See her memory` button, without blocking Next or the typewriter.
- [x] Use the already generated grandmother-room and upstairs-door illustrations respectively. Each scene has two named, keyboard-accessible objects with short contextual observations tied only to facts already read.
- [x] Return to the same paragraph and restore focus. Save which objects were observed; History offers a way to reopen only memories already visited. Handle missing images with the text-based object list.
- [x] Keep memory captions clearly separate from dialogue, and do not add a face for the lodger or modify existing story text.

## 3. Verify and document

- [x] Add focused state and browser checks for both response paths, skip, duplicate input, legacy save migration, memory focus/keyboard/image failure, refresh, History and unchanged chapter progression.
- [x] Run `npm test`, `npm run test:e2e`, `npm run build`; inspect PC screenshots and repair issues. Document AI use and limitations in README/PROCESS. Human playtesting remains pending.
- [x] Commit locally; do not push. Leave pre-existing modified design document and untracked portrait options untouched.

## Verification

35 unit tests and 48 Chrome browser tests passed; production build passed with the existing Three.js chunk-size warning. Independent review identified and verified fixes for chapter-end memory persistence and restoring History focus/scroll. Screenshots: `docs/screenshots/listening-choice.png`, `docs/screenshots/her-memory-room.png`. Independent human playtesting remains pending.
