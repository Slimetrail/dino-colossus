# Where every sound effect and icon comes from (Dino Colossus v26, checked 2026-11-01)

How we checked: we downloaded the public file from each source page and compared it with our game file
by sound wave (best match score, 1.0 = same sound). Our copies are re-cut / re-encoded, so they are
NOT byte-identical; they are the same recordings. Copies of each page (plain text) are in `pages/`.
CC0 full legal text: `CC0-1.0-legalcode.txt` (from https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt).

| Game file | Status | Source page | Author | Licence | Original file | Match |
|---|---|---|---|---|---|---|
| sounds/roar.mp3 | matched by audio comparison on 2026-11-01 (Security Response) | https://opengameart.org/content/retro-monster-roar | greg300 | CC0 | Skeleton Roar.mp3 | same recording, mono re-encoded and louder; likely re-encoded, not byte-identical (waveform correlation 0.98, envelope 0.998) |
| sounds/stomp.mp3 | verified by audio comparison 2026-11-01 | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Audio/impactSoft_heavy_000.ogg | 1.00 |
| sounds/land.mp3 | verified by audio comparison 2026-11-01 | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Audio/impactSoft_medium_000.ogg | 1.00 |
| sounds/chime.mp3 | verified by audio comparison 2026-11-01 | https://kenney.nl/assets/interface-sounds | Kenney | CC0 | Audio/confirmation_001.ogg | 1.00 |
| sounds/cheer.mp3 | verified by audio comparison 2026-11-01 | https://kenney.nl/assets/music-jingles | Kenney | CC0 | Audio/Pizzicato jingles/jingles_PIZZI00.ogg | 1.00 |
| sounds/sparkle.mp3 | verified by audio comparison 2026-11-01 | https://kenney.nl/assets/digital-audio | Kenney | CC0 | Audio/powerUp1.ogg | 0.95 (trimmed) |
| sounds/silly-toot.ogg | verified by audio comparison 2026-11-01 | https://opengameart.org/content/gastric-distress | LFA | CC0 | gastricdistress_bylfa_0.wav | 0.93 (trimmed) |
| sounds/silly-boing.ogg | verified by audio comparison 2026-11-01 | https://opengameart.org/content/boings | EZduzziteh | CC0 | bing_01_0.mp3 | 0.94 |
| sounds/silly-pop.ogg | verified by audio comparison 2026-11-01 | https://opengameart.org/content/boings | EZduzziteh | CC0 | bung_01.mp3 | 0.97 |
| sounds/silly-whoosh.ogg | verified by audio comparison 2026-11-01 | https://opengameart.org/content/air-whoosh | pyranostudios | CC0 | whoosh2_0.wav | 0.90 (first 1.5 s) |
| sounds/silly-warn.ogg | verified by audio comparison 2026-11-01 | https://opengameart.org/content/silly-sound-effects | EZduzziteh | CC0 | plup.mp3 | 0.99 |
| icons/icon-192.png, icon-512.png, maskable-512.png | own-made | none (our own pixel dino CARN_A in sprites.js) | Slimetrail | CC0 (own work, see OWN-WORK-CC0.txt) | - | `tools/make_icons.py` rebuilds all three pixel-for-pixel from sprites.js (0 different pixels) |

Kenney licence text (each pack's own License.txt) is saved in `pages/kenney-*-License.txt`.
OpenGameArt pages state the licence "CC0"; the full CC0 text is in `CC0-1.0-legalcode.txt`.

What we cannot prove: who first downloaded the files or when (v13 saved no record), and whether each page said CC0 on that day
(we read the pages on 2026-11-01). Kenney and OpenGameArt are trusted to have named the right author.
