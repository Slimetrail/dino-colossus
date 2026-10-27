# v18 — wide-phone fixes (Jeremy, Samsung S26 Ultra, landscape, Hard)

Report: "See cant get the human in the corner" (Bonus Cave 2 and 4).

## Root cause
1. **The cave walls were at the very edge of the screen.** The room was exactly the width of the screen, and the dino was stopped by its hit box. But the drawn dino (fat body, head, top hat) is wider than its hit box, so at the right wall his face and hat were drawn off the screen. A human standing in the corner was then hidden under the dino or past the edge.
2. **Belly full = no grab.** In both screenshots the belly was full (36/36, 33/33). The game quietly ignores humans when the belly is full, so even touching a corner human did nothing.
3. **The "swap power" label sat in the play area.** Its landscape position rule was overridden by a later CSS rule, so it fell back to the portrait spot, right over the right cave corner and the dino.

## Changes
- Bonus cave: there is now a 26-unit margin inside the screen edges, plus any safe-area/cutout inset. The walls are drawn (stone edge), and humans spawn and stay inside the reachable floor.
- Boss arena walls are inset the same way, so the dino is never cut off at either arena wall. On normal levels the dino can't walk under a left cutout inset.
- Full belly in the bonus cave: touching a human still grabs it for +50 ("Full! +50"). The belly stays capped.
- "swap power" now sits in the bottom control strip, left of the power button, below the floor line. It is a bigger tap target (≥36 px).
- The HUD belly meter is placed clear of the 🏠/🔊 buttons on wide screens.
- Safe-area insets are read through `#sap` (CSS `env(safe-area-inset-*)`, overridable with `--sal/--sar` for tests).
- SW cache v18, menu v18. Save format unchanged.

## Tests
`tests/test_v18.py` covers 1024x473 at DPR 3 (with and without a 42 px left inset), 1040x473 (2.2:1) with an offset, 915x412 at DPR 3.5, 960x432, 1100x500, 1200x540 with an inset, and 740x360. Each layout checks both corners at empty, fat and full belly with the top hat on Hard, the roll form on a normal level, and both boss walls. It also checks the swap button's position and size, and that there are no console errors. The v17 menu check now reads the version from sw.js.
