# Dino Colossus v17 — glitch fixes

**Hidden level = the Secret Bonus Cave** (break the cracked crate, step into the secret door: a one-screen cave full of cave people, two ledges, walls on both sides, 12 s timer).

1. **Bonus cave corners.** When the dino got bigger (belly fills up, FAT or ROLL) while touching a side wall, its body overlapped the wall and the game "fixed" that by snapping it on top of the wall (above the screen) or under the floor. Then it fell out of the world, landed back in the normal level off-screen ("disappeared") and could lose hearts. Now walls always push the dino sideways, never up or down, and in the cave the dino is kept inside the room (floor, both walls, and a ceiling just below the top bar). Falling out of the cave can't hurt you. Cave people in both corners can now be grabbed.
2. **Respawn near a pit.** Every pit fall (and lava) cost a heart and put the dino right back at the pit edge, so a held forward button walked it straight back in — many hearts in a few seconds. Now after any respawn (pit, lava, life lost, Continue YES):
   - the dino comes back on solid ground at least a little way back from the pit edge,
   - it blinks and waits 0.5 s,
   - forward/back buttons (touch and keyboard) are ignored until you lift your finger and press again,
   - for 1.5 s it is safe: no damage, and a fall just puts it back without losing a heart.
- Same respawn code for normal levels, the cave and Continue. Boss restart, Calm, mute and saves are unchanged (no new save keys).
