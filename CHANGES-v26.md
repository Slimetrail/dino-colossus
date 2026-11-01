# Dino Colossus v26 (local only, not published)

What changed, in plain words:
- Pause box: the "Yes, menu" and "No, keep playing" buttons are now 48 px tall on every screen (they were 38 px on wide short phones).
- The home button and the sound button no longer touch (they overlapped by 2 px; now 4 px apart).
- When you leave the app (switch apps, lock, or click away), the WHOLE game stops: clock, creatures, boulders, the silly human. It goes on when you come back. Before, only the silly human's timer stopped.
- Small phones (320x568): the start screen now fits. Top 10, Calm, Sound and the credit line are on screen with no scrolling.
- Update button: the game now asks for one fixed file name (sw.js), so a new version needs ONE tap and ONE reload (it needed two). Note: the very first move from v25 to v26 may still ask twice, because v25 used the old name. After that it is one tap.
- Sounds: every sound effect is now traced to its real page by comparing the sound waves (roar: greg300, OpenGameArt; stomp, land, chime, cheer, sparkle: Kenney packs; 5 silly sounds: OpenGameArt). All CC0. Page copies and the full CC0 text are in licences/. Table: licences/SOUNDS-AND-ICONS-v26.md.
- Icons: they are our own pixel dino from the game. tools/make_icons.py rebuilds them exactly.
- No art changes. No ads.
- Version 26 everywhere (cache dinocol-v26, ?v=26, footer "v26 · A Slimetrail production"). Older tests: only their version numbers changed.
- New tests: tests/test_v26.py.

Not changed: the folder sounds-silly/ is a work folder of downloaded originals for the silly sounds. The game does not use it, so it is not added.
