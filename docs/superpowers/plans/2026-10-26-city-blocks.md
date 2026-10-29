# Petersburg city blocks implementation plan

**Goal:** Fill the allowed camera views with continuous town blocks, varied architecture and a literary pink house.
**Architecture:** Extend the existing procedural city and static material batching. Keep detailed canal buildings and simpler outer blocks; preserve all walking and reading state.
**Tech stack:** Three.js, Vite, native HTML/CSS.
**Spec:** The six-point city improvement list accepted by the author on 26 October 2026, with direct execution requested.

- [x] Extend outer streets and receding blocks beyond the camera extremes. Use reduced facade detail at the perimeter.
- [x] Add roof, cornice and courtyard-gate variants; distinguish the small pink house on the left bank.
- [x] Add cross streets and stone quay joints; tune fog so buildings remain visible before fading.
- [x] Inspect desktop default, both rotation extremes, zoomed-out, and mobile screenshots. Check the existing walking, picking and reading flows; run build and unit checks.
- [x] Record actual results and updated screenshots in PROCESS.md and commit locally.

Review focus: visible bare map edges; foreground occlusion of entrances; camera rotation and zoom extremes; slower initialization from added geometry; touch and keyboard location access. This is a literary interpretation of Petersburg, not a surveyed historical reconstruction.
