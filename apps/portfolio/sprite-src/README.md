# Character sprite sources

`point.png` and `dance.png` are the background-removed photographs the pixel
sprites in `static/character/px-*.png` are generated from. They live here
rather than in `static/` so they are versioned but **not served** — at ~200KB
each they would otherwise be deployed for nothing.

The full-resolution originals (~2MB each) are in `assets-source/` at the repo
root, which is gitignored.

## Regenerating

Background removal (originals → these files):

```python
from rembg import remove, new_session
session = new_session("u2net_human_seg")   # the human model; plain u2net eats fingers
remove(data, session=session, alpha_matting=True,
       alpha_matting_foreground_threshold=250,
       alpha_matting_background_threshold=15,
       alpha_matting_erode_size=6)
```

Pixelation and rigging (these files → `static/character/px-*.png`):

- resize to 120px tall with `Image.BOX` (averages each block before snapping,
  so skin and denim stay flat and readable instead of turning to noise)
- hard-threshold alpha at 110 for crisp pixel edges
- quantise to 28 colours, MEDIANCUT, no dithering
- split at the narrowest row in the middle third of the figure — that is the
  waist, and it is the hinge the whole animation rig turns on

The measured split points are baked into `RIG` in `src/lib/character/Sprite.svelte`.
Regenerating at a different height means updating those numbers.
