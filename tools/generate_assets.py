"""Generate project illustrations with the user-authorized classroom Qwen API.

Usage: python3 tools/generate_assets.py --env /path/to/classroom/.env
Only the Python standard library is required. Never exposes or saves credentials.
"""
import argparse
import base64
import json
import os
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[1]
STYLE = ('Original literary game background, 19th century Saint Petersburg during white nights. '
         'Hand-drawn storybook illustration with elegant thin ink contour lines, cel shaded flat color planes, '
         'delicate paper grain, muted lavender shadows, sage teal rooftops, warm ivory plaster, pale apricot horizon. '
         'Quiet contemplative romantic atmosphere. Wide cinematic composition, no text, no lettering, no watermark, '
         'no people. Ground-level perspective, not a map. Keep the lower quarter simple for overlaid dialogue. ')
PROMPTS = {
    'canal-night': STYLE + ('A quiet canal embankment at luminous summer dusk, wrought iron railing in foreground, '
        'a solitary wooden bench to the right, a graceful low stone bridge crossing a dark teal canal in the middle distance, '
        'classical apartment facades on both banks, warm little gas lamps. Soft violet sky with a few stars, '
        'the sky never fully dark. Architectural detail, delicate imperfect pen drawing, melancholic beauty.'),
    'morning-room': STYLE + ('A small modest attic room in a Petersburg boarding house, rainy pale morning. '
        'A tall window overlooking muted rooflines, a wooden desk with one folded letter, an empty chair, '
        'faded olive wallpaper and gauze curtains. Blue-grey rain light with a faint warm edge on the paper. '
        'Intimate still life, quiet ending, rich atmospheric illustration.')
}
PORTRAIT_STYLE = ('Original literary visual novel character portrait, mid 1840s Saint Petersburg. '
    'Hand drawn European graphic novel illustration, delicate imperfect dark grey pen contours, '
    'restrained cel shaded flat color planes, subtle watercolor paper texture. Muted sage, dusty blue, '
    'lavender shadows and warm ivory highlights. Natural human proportions, expressive gentle face, '
    'quiet intimate emotion. NOT photorealistic, NOT 3D, NOT a silhouette, NOT chibi. '
    'One character only, head and upper torso, entire head and shoulders comfortably within the frame. '
    'Solid warm ivory paper background, no scenery, no frame, no lettering, no watermark. ')
PROMPTS.update({
    'dreamer-portrait': PORTRAIT_STYLE + ('The Dreamer, a shy 26 year old young man with slightly tousled '
        'soft brown hair, a clean shaven narrow face, thoughtful grey eyes, a slender build. '
        'Wearing a modest worn dusty blue frock coat, ivory shirt and simple dark neckcloth. '
        'Three quarter view turned gently to the RIGHT, looking towards someone beside the viewer. '
        'Reserved tender expression, lips slightly parted as if confiding a story. Chest-up portrait.'),
    'nastenka-portrait': PORTRAIT_STYLE + ('Nastenka, a 17 year old young woman, dark brown hair neatly '
        'gathered under a small pale ochre yellow bonnet with ribbons. Large dark observant eyes, '
        'natural youthful face, a shy hopeful almost-smile. Wearing a simple black short cape over '
        'a modest high neck ivory dress, fully clothed in historical daywear. '
        'Three quarter view turned gently to the LEFT, listening towards someone beside the viewer. '
        'Chest-up portrait, warm and believable expression.'),
    'summer-street': STYLE + ('A quiet residential Petersburg street in early summer, one small pale pink '
        'house among ivory facades, open tall windows, a cart with covered furniture parked in the distance. '
        'Sunlit pale apricot sky at late afternoon, a hint of green trees beyond the city. '
        'Wide view from the pavement, intimate detailed linework, no people, no modern objects.'),
    'rainy-embankment': STYLE + ('The same type of Petersburg canal embankment under gentle summer rain, '
        'wet pale cobblestones and an empty wooden bench beside delicate wrought iron railings. '
        'A low stone bridge and sage rooftops dissolve into grey lavender drizzle. '
        'Clouded luminous twilight, soft reflections, loneliness without horror. No people, no umbrellas.'),
})

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env', type=Path)
    parser.add_argument('--only', nargs='+', choices=list(PROMPTS), help='Generate only these missing assets')
    args = parser.parse_args()
    key = os.environ.get('EASEL_KEY')
    if not key and args.env:
        for line in args.env.read_text().splitlines():
            name, sep, value = line.partition('=')
            if sep and name.strip() == 'EASEL_KEY':
                key = value.strip().strip('\"\'')
    if not key:
        raise SystemExit('EASEL_KEY is unavailable; provide the classroom env file.')
    target = ROOT / 'public/assets'
    target.mkdir(parents=True, exist_ok=True)
    for name, prompt in PROMPTS.items():
        if args.only and name not in args.only:
            continue
        output = target / f'{name}.png'
        if output.exists():
            print(f'Preserved existing {output.name}', flush=True)
            continue
        body = {'model': 'qwen-image-2.1', 'prompt': prompt, 'size': '1024x1024' if 'portrait' in name else '1536x1024', 'n': 1, 'response_format': 'b64_json'}
        request = Request('https://easel.ait4x.org/v1/images/generations',
            data=json.dumps(body).encode(), headers={'Authorization': 'Bearer '+key, 'Content-Type': 'application/json'})
        try:
            with urlopen(request, timeout=600) as response:
                result = json.load(response)
            output.write_bytes(base64.b64decode(result['data'][0]['b64_json']))
        except HTTPError as error:
            print(f'Image service returned HTTP {error.code}; no credential or response body logged.', flush=True)
            raise SystemExit(1)
        except (URLError, KeyError, ValueError) as error:
            print(f'Image generation failed: {type(error).__name__}', flush=True)
            raise SystemExit(1)
        (target / f'{name}.json').write_text(json.dumps({
            'provider': 'classroom Easel API', 'model': body['model'], 'prompt': prompt,
            'requested_size': body['size'], 'purpose': 'Original character portrait for White Nights' if 'portrait' in name else 'Original background for White Nights',
            'generated_on': date.today().isoformat()
        }, ensure_ascii=False, indent=2))
        print(f'Saved {output.name} ({output.stat().st_size} bytes)', flush=True)

if __name__ == '__main__':
    main()
