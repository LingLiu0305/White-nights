# White Nights

An English interactive narrative after Fyodor Dostoevsky’s *White Nights*. Explore an illustrated Petersburg canal, follow the dreamer through four nights and a morning, and read at your own pace. The ending follows the novel; exploration and reading pace belong to the reader.

![The expanded city](docs/screenshots/type-home.png)
![City viewed from the side](docs/screenshots/city-wide.png)
![The dreamer walking near an interactive place](docs/screenshots/map-walking.png)
![English narration](docs/screenshots/fixed-dialogue-narration.png)
![Dialogue and character portrait](docs/screenshots/fixed-dialogue-speaker.png)

## Who it is for

Readers who enjoy literature and visual novels, including people unfamiliar with the original. The story starts with the dreamer’s solitary life before his first meeting. There are 152 adapted paragraphs across five chapters, approximately 3,729 English words. This is an abridged adaptation, not a verbatim edition.

## Main interaction

1. **Explore the city:** hold the arrow keys (↑ ↓ ← →) to walk the dreamer along the embankment and over either bridge. A nearby place lights up; press Enter to explore it. Drag to turn the view within a limited angle; scroll to zoom. Hover or focus a location to reveal its name. On a touch screen, tap once to reveal and again to enter. `Places` offers a location directory; `Reset view` restores the camera.
2. **Begin a chapter:** select `Begin First Night`. The dreamer walks from the current map position to the chapter’s place before the reader opens. `Skip transition` skips this journey. Reduced-motion preferences bypass camera transitions and disable continuous ambient animation.
3. **Read:** use `Next`, Space or Right Arrow. While text is appearing, the first action reveals the rest; the next advances. `Back` or Left Arrow returns to the previous paragraph. The dialogue frame stays fixed while text appears; longer passages scroll inside it. Text is selectable. Narration uses a wide reading area; dialogue places the speaker’s portrait at the appropriate side.
4. **Resume:** `History` shows the current chapter’s read paragraphs. `Map` returns to the city. Progress is saved in this browser, with independent reading positions for unlocked chapters.
5. **Sound and reset:** sound is off initially. Use the music button on either screen; the reader includes volume control. `Restart story` is on the homepage and asks before clearing all reading progress. The same action is in `About`.

## Run in VS Code

Use Node.js 22.12+ (or Vite-compatible Node 20.19+) and a modern browser. Tested with Node 26.2.0, npm 11 and Google Chrome. Open this folder in VS Code and run:

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal, normally `http://127.0.0.1:5173/`. Stop with Ctrl+C. Do not open `index.html` directly.

Only dependency installation requires a network connection. Reading requires no API key, paid account, Python or AI service. All four scene illustrations, both portraits, and Nunito Sans / Lilita One fonts are bundled. WebGL 2 renders the city; if unavailable, the location directory and reading remain available.

For a production preview:

```sh
npm run build
npm run preview
```

The static output is in `dist/`, with relative asset paths suitable for a GitHub Pages subdirectory. No public live experience has been published yet.

## Verification

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests use installed Google Chrome and start or reuse the local development server. They cover all five chapters, English-only content, walking and place proximity, restart confirmation, save restoration, touch use, portraits, small-screen layouts, actual audio output, failure feedback, camera transitions and interrupted dialogs. Screenshots are written to ignored `test-results/`.

Automated checks and AI reviews do not replace the assignment’s independent human trial. That trial remains to be completed in [PROCESS.md](PROCESS.md).

## Project structure

| File | Purpose |
| --- | --- |
| `src/story-text.js`, `src/content.js` | English prose, speaker names, chapter metadata and locations |
| `src/story.js`, `src/main.js` | Progress state and interface behavior |
| `src/map.js`, `src/walking.js`, `src/scene-art.js` | City geometry, walkable route, miniature character, materials, camera and picking |
| `src/style.css`, `src/home.css`, `index.html` | Reading and city layouts |
| `src/music.js` | Original melody and bass synthesized with Web Audio |
| `public/assets/`, `tools/generate_assets.py` | Bundled illustrations, prompt records and optional generation tool |

An interaction to explain in class: arrow keys move the dreamer along the bank or bridge; entering a place’s proximity highlights it, and Enter opens its description. Starting a chapter dispatches `START`; `map.travel()` follows the paved route; `ARRIVE` opens the saved paragraph. English-only presentation keeps all 152 paragraph indices, so existing saves remain valid.

## Optional illustration generation

This is a browser project. The optional generator uses only Python’s standard library, with no additional Python dependencies. Existing assets are preserved. Place the classroom credential in an external `.env` file as `EASEL_KEY=...`, then run:

```sh
uv run --no-project --python 3.12 tools/generate_assets.py --env /absolute/path/to/classroom/.env
```

The classroom Easel / Qwen Image API may consume classroom credits. Add `--only dreamer-portrait nastenka-portrait summer-street rainy-embankment` to select assets. Credentials never enter browser code or asset metadata; prompt records are stored beside the generated images. The city and miniature character use procedural geometry, not this API.

## Limitations

- The city and routes are literary interpretations, not historical reconstructions. Walking stays on the canal pavements and two bridges; other streets are scenery.
- Portraits have fixed expressions; some scenes share illustrations.
- Saves are local to the current browser. Storage failures show feedback without blocking reading.
- Real phone performance, other browsers and an independent human trial remain unverified.
- The Three.js build chunk produces a size warning; it does not prevent building.

[Process](PROCESS.md) · [Credits](CREDITS.md) · [Repository](https://github.com/LingLiu0305/White-nights)
