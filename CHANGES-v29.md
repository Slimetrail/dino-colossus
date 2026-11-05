# Dino Colossus v29 (Jeremy)

Built on live v28 commit `fa9ed65e84f9ed61bc1f4dc4b5afa8116ca59995` (tag live-v28-fa9ed65). Review only. The live site is not changed.

1. **Rolling boulders bounce off rocks.** They used to hop up a face (`vy = -7` and a 2 px shove) and climb over. Now the horizontal direction flips. They can fall into a hole (v28 `holeGone` is still what removes them). Between two rocks they bounce back and forth. A short step-out (at most 8 px, only while still inside a non-ground solid) keeps them from sticking in the face or tunneling through.
2. **A head stomp pops a spear guy.** Falling onto the head (feet in the top 18 px, and the dino's middle over the body) removes that spear guy with a pop and a small bounce. The dino takes no damage. A falling hit that misses the head still hurts ("Pointy spear"). Side contact is the same as v28 (a knock, or a dropped snack if the belly is full). Other people are not spear guys: a full belly does not pop them.
3. Version 29 (sw VER, cache `dinocol-v` + build, `?v=29`, footer "v29 · A Slimetrail production", version.json, README). Older tests: only the pinned version strings changed from 28 to 29.

## Tested (ran)
`tests/test_v29.py` on a pretend phone (headless Chromium with touch, 915x412 and 412x915), not a real phone.
- Boulder reverses on a rock, does not climb, does not pass through.
- Boulder falls in a hole and is gone (`holeGone`). Lava that reaches a hole is gone.
- Boulder bounces between two rocks: direction flips more than once, it keeps moving, it never overlaps a rock or passes through.
- Head stomp: spear guy is gone, hearts unchanged, dino bounced up, a puff played.
- Falling hit that misses the head: spear guy stays, a heart is lost.
- Side hit: spear guy stays, dino is knocked, no heart lost.
- Full belly on a normal person: the person stays (not a spear pop).

`tests/test_v28.py` version pins were moved to 29 and the v28 hole / lava / safe-respawn checks still run.

## Read in code (not a separate behavior run)
- `holeGone`, `safeNear`, and the respawn "never over a hole" search are the v28 code, unchanged.
- Little dinos and critters still use their own stomp. People are still eaten, not popped.
- The spear picture still points sideways. "Spear points up" is the miss-the-head falling hit.
- No ads and no secrets were added.
