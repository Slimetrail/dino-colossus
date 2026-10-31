# v23 – Hard mode changes from Jeremy (local, not published)
Jeremy: "In dino you have to eat the human walking, not the human racing to be eaten, increase the spear people by 20 percent and decrease the rolling rocks by 30 percent in hard."
- Silly human (Hard only): it no longer races into the dino's mouth and gets eaten by itself (the v22 behaviour). It now walks on the ground ahead of the dino, walking away; you must catch and eat it for its trick. Missed = gone, no trick. It still never hurts. Ordinary walking people feed and score as before.
- Spear people (Hard only): x1.2 on the v22 value (multiplier 0.35 -> 0.42). Sections 1/3/5: 1/3/4 -> 1/3/5; sections 1-10 total 46 -> 55.
- Rolling boulders (Hard only): 30% fewer (gap / 0.7). Middle-draw gap s1/s3/s5: 2.21/1.83/1.6 s -> 3.16/2.61/2.29 s. Meteor-shower rocks unchanged (they fall, not roll).
- Easy and Medium unchanged (tests/test_v23.py checks spear counts and boulder gaps).
- Version 23: sw VER (cache dinocol-v23) and ?v=, index.html ?v=, footer "v23 · A Slimetrail production". test_v21/test_v22 version checks moved to 23; test_v22 "silly human always eaten" check replaced by test_v23.
