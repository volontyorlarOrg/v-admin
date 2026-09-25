# The country ground

Behind every screen, Uzbekistan's fourteen regions are drawn as a slow line
terrain. It is atmosphere, not information: it carries no data, is hidden from
assistive technology, and stops the moment someone acts. `DESIGN.md` states the
visual rules; this page records how it is built.

## Geometry

The region outlines are the Natural Earth administrative boundaries (public
domain) that `../v-web` already ships for its map, copied into
`src/lib/map/region-geometry.ts` and projected onto a 2 × 1.302 extent.
`src/lib/map/ground.ts` turns them into the terrain, and its tests beside it pin
the behaviour:

- `rasterizeMask` fills each region polygon separately and combines them, so a
  region's holes and enclaves stay right, and `softenMask` blurs the edge;
- `reliefAt` raises a low plateau over the whole country and ridged mountains
  toward the east, where the real ranges are;
- `buildField` samples ruled lines across the country and a margin around it,
  lifting each point by the relief, and `drapeRings` lays the region borders on
  the same surface.

## Rendering

`src/components/portal/ground/scene.ts` draws the field and the borders as
three.js line segments with a small vertex shader: a slow swell moves the lines,
and they fade toward the camera, toward the horizon and toward either side, so
the field never shows an edge. Colours come from the theme's tokens at paint
time and are read again when the theme changes. `country-ground.tsx` loads
three.js only in the browser, caps the pixel ratio at 1.5 and the frame rate at
30, and falls back to a tilted SVG outline when WebGL is missing or its context
is lost.

## Placement

The camera has one fixed pose per variant: the sign-in doorway and the signed-in
workspace. The country's projected outline is measured once at that pose, and
the scene fits it into a rectangle with a camera view offset, so the country
keeps its shape and relief at every screen size instead of being stretched or
cropped.

That rectangle is a `GroundWindow`: an empty, `aria-hidden` element a layout
places where the country should sit. `PageHeader` renders one in the band
between the title and the actions from the large breakpoint, and the sign-in
layout renders one beside the sheet (above it on a phone). The window reads
`--ground-align-x` and `--ground-align-y` for how to align the country inside
it. When a page changes, the country glides to the new window; when a window is
released, the old placement is kept for 450 ms so a loading skeleton does not
make it jump; a window smaller than 160 × 48 is ignored, and without a window the
country rests at the bottom of the first viewport on the workspace and in the
right half of the sign-in page.

## Motion

- It drifts slowly and leans a little toward a fine pointer.
- Any pointer press, key, wheel or touch movement stills it; it resumes 2.6
  seconds after the last one.
- It stops while the tab is hidden.
- Under `prefers-reduced-motion` it paints one frame and never animates.
