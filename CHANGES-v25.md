# Dino Colossus v25 (local only, not published)

From QA Tester / Skeptic / Security verdicts on v24 (95f47d9), via Eve.

- E1: sound now unlocks on the first finger-UP (pointerup), never on finger-down. "Tap to start" also acts on finger-up (intro.js gate, vis.js unlock).
- E2: storage probe now uses a READ (getItem). A full disk (setItem throws QuotaExceededError) no longer throws away saves: Best, difficulty, mute, Calm, Top 10, dress-up and unlocks all load. Writes are wrapped (fail quietly). Storage fully blocked -> in-memory, as in v24 (game.js, vis.js).
- E3: every start-screen button is at least 44 px tall and wide, and the sound/home buttons are 44 px. Short screens (640x360 landscape, 360x640 portrait) got tighter spacing so everything still fits without scrolling.
- E4: service worker install is all-or-nothing: if a file is missing the half-filled new cache is deleted and the old version keeps running. A file the server answers 404/500 for falls back to the saved copy. Only helps updates FROM v25 onward; a v24 phone still runs the v24 worker for the v24->v25 step.
- E5: the silly human's 8 s timer stops while the app is hidden or loses focus.
- 640x360 (narrow landscape): home/sound buttons move just below the HUD bar during a run when the belly meter cannot fit beside them; back to the top when the run ends.
- DIFFICULTY.md: late-starter numbers re-measured (portrait and landscape) and the creature case added.
- CREDITS.md + licences/SOUND-EFFECTS-UNVERIFIED.txt: roar author corrected to greg300 (CC0 per the source page); per-file Kenney/roar origin still unverified, clearly marked.
- tests/test_v25.py (new); tests/test_v21-24 version strings bumped 24 -> 25.
- sw VER 25, ?v=25 everywhere, footer v25.
