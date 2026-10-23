# Taste review · 23 October 2026

The project is an interactive literary map, rather than a scrolling landing page. I used the installed `design-taste-frontend` inspector at 1440, 768 and 390 px, then reviewed its images alongside actual settled map and reading screenshots. The city, the four original scene illustrations and the two character portraits are the visual material already in the project.

**Idea:** the river and bridges in *White Nights* become a walkable route between story moments. **Live interaction:** the reader moves the dreamer with the arrow keys, receives a nearby-place highlight and enters a location with Enter.

ROUND 1 (before the taste adjustments)

Seen in one second: a purple city with the river as the central axis.
Idea (one sentence): a Petersburg canal carries the nights of the story.
Live thing: chapter entry and location selection; walking was being added.
Layout words by section: opening=full-screen scene / chapter entry=bottom overlay / reading=illustrated stage.
Scores: design 6.8 · usability 6.6 · creativity 8.0 · content 7.5 → raw overall 7.1.
Caps applied: the page inspector reported 8 FAIL and 5 WARN, so its formal score cannot exceed 6.0.
Top three problems:
1. The outer streets had wide bare edges in the author's homepage screenshot. Added sixteen more procedural houses, especially along the side and foreground streets.
2. The chapter action read like a small link in `desktop-fold.jpg`. Made it a larger, filled, square-cornered action and increased the nearby chapter type.
3. The attached dialogue screenshot had a large pale halo behind Nastenka. Replaced the oval mask with a narrow paper-cut contour around each portrait and increased the scene visible through the text band.

ROUND 2 (final review)

Seen in one second: the WHITE NIGHTS title above a denser city and a bridge.
Idea (one sentence): the novel's river becomes a path through its conversations.
Live thing: arrow-key walking, location proximity and Enter; the same places remain reachable by pointer, touch and the directory.
Layout words by section: opening=full-screen city / chapter entry=quiet lower overlay / reading=illustrated stage.
Scores: design 7.5 · usability 7.4 · creativity 8.1 · content 7.7 → raw overall 7.6.
Caps applied: the final inspector reports 5 FAIL and 4 WARN, so its formal score remains capped at 6.0. This is not a claim of a clean automated gate.
Top three remaining observations:
1. The far canal fades into a broad mist. It creates depth, though the nearest houses repeat a shared silhouette. A later art pass could vary roof and facade forms further.
2. The five chapter names remain small on a 390 px screen. Their full accessible labels are available to assistive technology; a later phone design could use a chapter list when there is more space.
3. The experience still needs the assignment's separate human trial on a real device. Browser checks are evidence of function, not a substitute for observing a reader.

The inspector's `covered-text` finding at 768 px was real: the nearby-place prompt sat over the chapter title. I moved the prompt above the chapter entry and added a tablet test. The final inspector no longer reports this collision. Its remaining flags are largely tied to a static marketing-page model: it does not count the original 3D city as imagery or its camera and water as motion; it treats the required chapter label as a decorative eyebrow; and it treats intentionally hidden place names as missing content, although the controls have accessible names and reveal those labels on focus. The final opening screenshots show a readable title and explanatory line. No stock photography or video was added to the interactive city.

The final screenshots checked were `map-desktop.png`, `map-mobile.png`, `immersive-opening.png`, `stage-dialogue.png` and `portrait-mobile.png` in this directory's `screenshots/` folder. The `.taste-skill/` measurement output is local and excluded from the repository.
