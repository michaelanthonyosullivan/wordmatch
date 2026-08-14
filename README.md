# Word Match

A child-friendly memory game built with Vite, React, and npm.

Twenty-four cards start face down. The hidden sides show eight three-letter words, each repeated three times. Flip three cards at a time. Matching words stay up; mixed words flip back. The game ends when all eight groups are found.

### Difficulty

- **Hard** (default) — the classic rules above: only a full set of three matching cards stays revealed.
- **Easy** — more forgiving for younger players. If two of the three flipped cards match, those two stay revealed permanently with a bold gold background, a dashed border, and a "2/3" badge, and the odd card flips back. Once the matching third card is found, all three flip to the normal green "matched" look. Finding that last card gives instant feedback — no need to wait or flip extra cards first.

Switch modes any time with the **Easy** / **Hard** buttons in the toolbar; doing so starts a fresh round with the same word set.

### Rules page

Tap the **Rules** button in the toolbar for an in-game explanation of the goal, how to take a turn, the Easy/Hard difficulty modes (with small visual examples), and what the stars and tries counters mean.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints, usually `http://localhost:5173`.
