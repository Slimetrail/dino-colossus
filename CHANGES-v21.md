# v21 – cinematic intro (local, not published)
- New `intro.js`: canvas-drawn intro (~14 s, ~9.3 s in Calm / reduced motion, no shake there) on every app open: cold launch, reload, and pageshow restore (not during a running game). Tap, click or any key skips. Ends by fading to the title screen.
- Scenes: chase 0–3.4 s · eruption 3.4 s · boulder launch 6.2 s · impact 8.0 s (dino flattened: legs, tail tip, neck and dazed head out, stars circling) · lava title on the boulder from 9.0 s · human turns 9.35 s and cheers from 9.5 s · fade 14.0–14.6 s.
- Title text is read from the game's own `#start h1`. No new sound or image files; the only sound is the existing CC0 effects (roar/land/stomp/cheer) through VIS.play, so mute and the effects slider apply. Silent on a cold launch until the first tap (browser rule).
- `?intro=0` turns the intro off. Only the older tests use it so their title-screen checks still run.
- Version 21: sw VER, ?v=, title line, SW SHELL (+intro.js). tests/test_v21.py added.
