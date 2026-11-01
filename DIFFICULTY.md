# Dino Colossus v15 – Difficulty

Keys unchanged: easy / medium / hard. Base values = old v14 Hard.
D = 1 (easy), 2 (medium), 8 (hard).
Ramp toward each boss: p = ((section-1) % 5) / 4, Dx = D * (1 + 0.4p)  (sections 1→5: Easy 1→1.4, Medium 2→2.8, Hard 8→11.2).

Curves (x = Dx, or D for bosses):
- enemy count rate = x^0.6 (littles cap 24, rangers cap 12)
- enemy speed = min(1.7, x^0.25)
- boss speed = 1.15*(1+.03(n-1))*min(1.5, x^0.2)
- boss HP = max(4, round((5+.55n)*1.2*x^0.4))
- bad-surprise chance = min(.6, .35*x^0.3)
- boss throw every = max(.9 s, 2.3/x^0.5); air time = max(40, 64/x^0.25) frames
- extra challenge level = min(2, floor(log2 x))
- pits ×min(1.25, x^0.1); boulder gap /rate (min 1.6 s)

| | Easy | Medium | Hard |
|---|---|---|---|
| Boss HP boss1/boss20 | 7/19 | 9/25 | 15/44 |
| Boss speed | 1.15 | 1.32 | 1.725 |
| Throw every / air | 2.3 s/64f | 1.63 s/54f | 0.9 s/40f |
| Littles s1/s3/s5 | 6/9/12 | 9/14/19 | 21/24/24 |
| Rangers s1/s3/s5 | 1/2/4 | 2/3/6 | 3/8/12 |
| Enemy speed × | 1–1.09 | 1.19–1.29 | 1.68–1.7 |
| Boulder gap s1/s3/s5 | 7.7/6.36/5.31 | 5.08/4.2/3.5 | 2.21/1.83/1.53 |
| Bad surprise | .35–.39 | .43–.48 | .60 |
| Pit chance | .233–.292 | .249–.313 | .286–.353 |

Hard only: silly human every 20–35 s; it walks away from the dino for up to 8 s (v24; must be chased and eaten), then stink (no run, 1.8 s), bubble (safe float, 2.6 s) or pogo (2.0 s). Never kills; falls during/after effect respawn without hurt. Calm halves durations, no shake/vibration.

## v23 changes (Hard only; Easy and Medium unchanged)
- Spear people: Hard multiplier 0.35 (v22) x 1.2 = 0.42. Per section 1/3/5: v14 base 3/8/12, v22 1/3/4, v23 1/3/5. Sections 1-10 total: v22 46, v23 55.
- Rolling boulders: Hard boulder gap / 0.7 (30% fewer boulders per minute). Middle draw s1/s3/s5: v22 2.21/1.83/1.6 s -> v23 3.16/2.61/2.29 s. Falling meteor rocks (Meteor Shower challenge) are not rolling rocks and are unchanged.
- Silly human: no longer runs into the dino's mouth. It appears on the ground ahead of the dino and walks away (1.1 px/frame, dino 3.5). Its trick happens only if you catch and eat it; if it leaves the screen or 14 s pass, it is gone with no trick. (v24 note: in v23 it left the screen after about 2.7 to 3.5 s, so the 14 s limit never showed; see v24. Catching it gives no points, only its trick.)

## v24 changes (Hard only; Easy and Medium unchanged)
- Silly human spawn: 120 px clear of the dino's body (gap between the two boxes), on the side the dino faces, walking away. If that side has no room on screen (8 px margin), it spawns 120 px on the other side and walks away that way. If the dino is put back after a pit (moves >20 px in one frame), the human is placed again 120 px away.
- It stops at the screen edge (8 px in) instead of walking off, and is gone after 8 s if not caught (v23: 14 s on paper, but it walked off in about 3.4 s). Chase from 120 px: about 50 frames (0.8 s) at 3.5 vs 1.1 px/frame; a player who starts 3 s late still catches it at about 5.1 s (measured on a pretend phone, flat ground).
- Spear people: Hard = round(v22 value x 1.2) per section (v23 used round(base x .42)). Sections 1-10: v22 1,3,3,4,4,5,5,7,7,7 (46) -> v24 1,4,4,5,5,6,6,8,8,8 (55).
- Boulder gap / 0.7 unchanged from v23.
