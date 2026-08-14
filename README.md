# Word Match

A child-friendly memory game built with Vite, React, and npm.

Twenty-four cards start face down. The hidden sides show eight three-letter words, each repeated three times. Flip three cards at a time. Matching words stay up; mixed words flip back. The game ends when all eight groups are found.

### Difficulty

- **Hard** (default) — the classic rules above: only a full set of three matching cards stays revealed.
- **Easy** — more forgiving for younger players. If two of the three flipped cards match, those two stay revealed permanently with a light cream background, and the odd card flips back. Once the matching third card is found, all three flip to the normal green "matched" look.

Switch modes any time with the **Easy** / **Hard** buttons in the toolbar; doing so starts a fresh round with the same word set.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints, usually `http://localhost:5173`.
