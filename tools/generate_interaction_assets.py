"""Generate missing memory illustrations for the interaction design proposal.

Usage: python3 tools/generate_interaction_assets.py --env /path/to/classroom/.env
Assets are prepared for later integration; this script does not change the game.
"""
import generate_assets as assets
STYLE = '''Original illustrated narrative game background for White Nights, 1840s Saint Petersburg. Thin slightly imperfect dark grey-purple ink contours, restrained cel shaded flat planes, delicate subtle paper grain. Muted lavender shadows, mist blue, warm ivory plaster, dusty peach and sage. Soft northern summer evening light. Architectural line drawing with simple color, matching an illustrated canal city. NOT photorealistic, no oil painting, no dense pencil shading, no glossy 3D. Wide cinematic landscape composition, lower quarter quiet for UI. No people, no faces, no lettering, no readable text, no watermark, no modern devices. '''
assets.PROMPTS = {
 'memory-grandmother-room': STYLE + '''A modest sitting room inside a small old wooden Petersburg house. Three tall narrow windows along the rear wall, pale warm light through thin curtains. At left an empty plain wooden armchair with an ivory shawl draped over its arm; beside it a small sewing basket on a side table. At center a modest table with two clearly visible closed clothbound books, blank covers without lettering. At right a half-open wooden interior door with a glimpse of a narrow staircase upward. Faded sage wallpaper, worn floorboards, simple domestic furniture, intimate and humble rather than grand or wealthy. Keep books, chair and doorway visually distinct for clickable observation hotspots. Empty room, a recollection of a sheltered life.''',
 'memory-upstairs-door': STYLE + '''A narrow quiet upstairs landing in the same modest nineteenth-century wooden house. A closed plain wooden lodging-room door on the right, worn stairs descending at the left edge, a small tall window at the far end casting pale ivory light on lavender floorboards. A small tied cloth bundle rests on a plain wooden bench near the door. Door, bundle and distant window all clearly separated in the composition for optional observation hotspots. Simple old plaster, restrained trim, worn but cared-for surfaces, no ornate palace decor. Quiet anticipation and vulnerability. No figure visible behind the door, no suggestion of horror.'''
}
if __name__ == '__main__':
    assets.main()
