# v21 – cinematic intro (local, not published)
- New `intro.js`: canvas-drawn intro (~14 s, ~9.3 s in Calm / reduced motion, no shake there) on every app open: cold launch, reload, and pageshow restore (not during a running game). Tap, click or any key skips. Ends by fading to the title screen.
- Scenes: chase 0–3.4 s · eruption 3.4 s · boulder launch 6.2 s · impact 8.0 s (dino flattened: legs, tail tip, neck and dazed head out, stars circling) · lava title on the boulder from 9.0 s · human turns 9.35 s and cheers from 9.5 s · fade 14.0–14.6 s.
- Title text is read from the game's own `#start h1`. No new sound or image files; the only sound is the existing CC0 effects (roar/land/stomp/cheer) through VIS.play, so mute and the effects slider apply. Silent on a cold launch until the first tap (browser rule).
- `?intro=0` turns the intro off. Only the older tests use it so their title-screen checks still run.
- Version 21: sw VER, ?v=, title line, SW SHELL (+intro.js). tests/test_v21.py added.

## v21 revision r2 (intro art + timing pass, still v21)
- Timeline now runs off performance.now() (wall clock), not frame counts: chase 0-3.4 s, eruption 3.4 s, boulder launch 3.65 s, landing 4.7 s, 0.1 s impact freeze, 0.3 s shake, stars from ~5.1 s, lava title 5.2 s (fully lit 5.6-8.7 s), fade 8.7-9.5 s. Total ~9.5 s (calm: x1.5 speed, ~6.3 s). Plays on every launch; no shortened variant.
- Art (all baked once to offscreen canvases): pillar legs with knee bulge, narrow ankle, darker inner edge, rounded pads with 3 toenails, tops hidden inside the body; lowered, thicker neck; heavy-browed head with a narrow eye and an open toothy mouth; back-to-side skin gradient, darker belly, fold lines; contact shadow under each planted foot and dust puffs at footfalls.
- Flattened pose: closed rounded limb ends, upturned feet with tan soles and nails up, pointed tail, half-closed eye and loose tongue (no spiral).
- Boulder: lumpy outline, layered strata, dark soil streaks, 5 shallow pits (no crater field), lava rim light on the volcano side, glowing cracks kept. Lava title unchanged.
- Stars: 5 big (r 18) baked stars on a ring around the head, drawn after the near ferns so nothing covers them.
- Human 1.5x, darker shaded skin, fear pose in the chase (arms thrown up, looking back, mouth open).
- "Tap to skip ▸" drawn from the first frame; skip hides the intro in ~350 ms.
- tests/test_v21.py: new durations, timeline/clock checks, 4x-throttle wall-clock length, skip stopwatch at 0.5 s / 3 s at 1x and 4x CPU.
