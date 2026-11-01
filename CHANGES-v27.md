# Dino Colossus v27 (local only, not published)

Fixes from QA Tester, Skeptic and Security Response on v26. The look is not changed (that is Jeremy's call).

## What changed
1. **Pause really pauses.** When the app loses focus or is hidden:
   - the "Continue?" countdown stops,
   - music and sound stop,
   - waiting things stop too: the "Continue?" prompt after the last life, the boss start, the champion tune and the little beeps. They now run on the game clock.
   - If the page comes back without a focus event, the game stays paused until you tap the screen.
2. **"Go to the menu?"** The home button no longer jumps up over "BELLY 0/30" (740x360). This came from v25: the button moved back to the top whenever the game stopped.
3. **Small phones (320 px wide).**
   - Continue YES and NO fit on the screen.
   - The top bar (HUD) is 12% bigger on phones under 380 px wide.
   - In portrait (every portrait size, not only 320 px), lives show as one dino icon plus a number, so they never touch the HUNGRY bar or BELLY.
   - The 320x480 start screen fits without scrolling, and the Sound button is on the screen.
   - In portrait, Dress up is one column: the items scroll in their own box, and the Done button sits under them, never on top of an item.
4. **Half-finished updates.** The game files load as before. If one did not arrive, the page reloads once in "fallback" mode:
   - the last complete saved version starts instead,
   - If there is no saved version, a "Try again" button shows.
   - The helper that saves the game for offline play now uses the saved copy first, so a new version starts only after every file of it was saved.
5. **New tests** (tests/test_v27.py) catch these breaks:
   - the silly human's first gap set to 30,
   - a CREDITS licence changed to CC-BY-NC,
   - updateViaCache removed.
6. **Credits.**
   - CREDITS.md now says sound effects and icons are "traced to the pages above; page CC0 labels trusted".
   - licences/OWN-WORK-CC0.txt has no internal folder path.
7. **test_v17 pit-fall check.** See "Flaky test" below.

## Flaky test
- Answer: **yes, test_v17's pit-fall check was flaky.** Before the fix it failed 3 of 10 runs (2 of 5 normal, 1 of 5 with the CPU slowed 4x). Tested on a pretend phone.
- Cause: the check holds forward for 4 seconds after a lava fall. Live enemies, rocks and shots kept moving. After the 1.5 s safe moment, one sometimes knocked the dino sideways, or a ranger's spear hit it. That moved it about 48 px (or into the lava again), so "held forward ignored" and "respawn spot back from the edge" failed. Found by logging every move and hit in 60+ extra runs.
- Fix (test only, no check made looser): the pit-fall check now clears enemies, rocks and shots before and during its frames. The game code is not changed for this.
- After the fix: 10 of 10 passed (5 normal, 5 CPU slowed 4x), plus 0 failures in 150 extra pit-fall runs. Tested on a pretend phone.

## Older tests
- test_v21 to test_v26 changed only in version strings.
- test_v17 changed for the flaky fix above.
- test_v26 now fails one check on purpose: "CREDITS: no sound left marked unverified" looks for the old words "Still unverified: nothing". Item 6 replaced those words, so this check is out of date. It was left as is, because older tests may only change in version strings.

## Version
Cache dinocol-v27, files ?v=27, footer "v27 · A Slimetrail production".
