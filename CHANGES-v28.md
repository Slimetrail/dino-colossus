# Dino Colossus v28 (Jeremy t1634u)

1. **Boulders and lava are gone when they fall in a hole.**
   - A rolling boulder whose middle is over a hole is removed as soon as it drops 8 px below the ground line, with a small orange puff. It can no longer hit anything on the way down. New boulders never start over a hole.
   - A lava flow is removed when its front edge reaches a hole (before, it hung about 28 px over the hole until its middle got there).
2. **The dino is never put back stuck over a hole.** After a pit fall, life lost, Continue, or a "stay" respawn, if the spot has no ground under it, the game looks left and right (10 px steps, at most 240 tries each way, so it always ends) for the nearest spot with ground under the whole dino. It checks on screen first, then anywhere. If there is no ground at all, it uses the middle of the nearest ground piece. The boss arena and the bonus cave are unchanged.
3. Version 28 (sw VER, ?v=28, footer "v28 · A Slimetrail production"). Older tests: only the pinned version strings changed from 27 to 28.

Tests: tests/test_v28.py, on a pretend phone (headless Chromium with touch, 915x412 and 412x915), not a real phone. Mutation checks: v27 game.js, the boulder fix off, the lava fix off, and the safe search off each make the matching checks fail.
