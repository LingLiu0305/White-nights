# White Nights Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A locally runnable, Chinese-language narrative experience with an explorable toon-shaded city, chapter travel, and illustrated linear reading.

**Architecture:** Vanilla JavaScript coordinates a Three.js map and a DOM-based reader. A pure story state module owns progression, persistence validation and replay. Content is a clearly credited original Chinese abridgment based on the Garnett text, with four nights and a short morning epilogue.

**Tech Stack:** Vite, Three.js, native HTML/CSS/JavaScript, node:test, Playwright.

**Spec:** ../specs/2026-10-21-white-nights-design.md

## Global Constraints
- Work in the user's existing White nights directory on feat/interactive-story; preserve the design document and origin.
- Fixed canonical ending, no invented branching romance mechanics.
- Separate optional location information from chapter entry; repeated locations are allowed.
- User authorizes the classroom Qwen image service for assets; credentials stay outside the repository and browser.
- First deliverable is a complete prototype with concise adapted text, not an unabridged translation or submission-ready user trial.

## Review Focus
- Rapid clicks and stale travel callbacks must not duplicate/skip chapters.
- Reload and replay must preserve genuine progress without unlocking unread chapters.
- Corrupt/unavailable localStorage must leave a readable experience.
- WebGL or background image failure must retain text and chapter access.
- Mobile, keyboard, reduced motion and modal focus must remain usable.

## Task 1: Story progression and content
**Files:** src/story.js, src/content.js, tests/story.test.js.
**Interfaces:** createState(saved), transition(state,event), readSave(storage), writeSave(storage,state); chapters and locations exported by content.js.
- [ ] Write failing behavioral tests for locked chapters, repeated starts, completion, replay progress, interrupted saves and corrupt storage.
- [ ] Implement state transitions and four nights plus morning using original Chinese paraphrase.
- [ ] Run npm test; expected all pass. Commit state/content.

## Task 2: Map and chapter reading experience
**Files:** index.html, src/main.js, src/map.js, src/style.css, public/assets/, tools/generate_assets.py.
**Interfaces:** createMap(container,{onSelect,onFail}) returns travel(route,onArrive), finishTravel(), setChapter(index), reset(), pause(bool). DOM controller sends events to story state.
- [ ] Write browser tests for location descriptions, travel skip, reading completion, return to map and persistence; observe failure before implementation.
- [ ] Build a cel-shaded canal neighborhood with bridges, street blocks, labels and a moving marker.
- [ ] Generate two background illustrations via the authorized classroom API, store prompts/provenance and integrate silhouettes.
- [ ] Implement accessible responsive layout, history, sound toggle, progress and reset.
- [ ] Verify desktop/mobile, WebGL fallback, failed image, repeated clicks, keyboard and storage failures. Commit feature.

## Task 3: Delivery and independent review
**Files:** README.md, PROCESS.md, CREDITS.md, docs/screenshots/, tests/experience.spec.js.
- [ ] Run full tests and production build; inspect screenshots and browser errors.
- [ ] Request one independent whole-branch review and resolve important findings.
- [ ] Document exact setup, limitations, credits, AI use and honest uncompleted human-trial section.
- [ ] Save screenshots, commit verified work, leave a working local preview. No remote push without the user's request.

## Execution record
- Design approved and implementation requested in chat; proceed inline without another approval round.
- Existing checkout is new and dedicated to this assignment; use a feature branch in the requested directory.
