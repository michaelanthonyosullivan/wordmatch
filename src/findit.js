// Pure helpers for the "Find it!" mode. All functions are side-effect free so
// they can be unit-tested in isolation.

export const BOARD_COLUMNS = 6 // desktop board grid
export const MAX_DISTRACTORS = 5 // tiles opened alongside the answer tile

// How visually alike two words are, so we can pick distractors that force a
// child to actually look at letter shapes instead of scanning first letters.
export function wordSimilarity(a, b) {
  let score = 0
  if (a[0] === b[0]) score += 3
  if (a[a.length - 1] === b[a.length - 1]) score += 3
  if (a.length > 2 && b.length > 2 && a[1] === b[1]) score += 2
  const shared = new Set([...a].filter((ch) => b.includes(ch)))
  return score + shared.size
}

// Build the "tight cluster": the answer tile plus up to five other face-down
// tiles near it, preferring distractors that look like the target word.
// The other copy of the target word is deliberately kept out so there is
// exactly one matching tile in the cluster. `seedId` is excluded explicitly so
// the seed is never selected as an answer even when state updates are async.
export function buildCluster(
  cards,
  answerId,
  targetWord,
  { seedId = null, matchedWords = [], partialCards = {}, columns = BOARD_COLUMNS } = {},
) {
  const answerIndex = cards.findIndex((c) => c.id === answerId)
  const col = answerIndex % columns
  const row = Math.floor(answerIndex / columns)
  const pool = cards
    .map((c, i) => ({
      c,
      dist: Math.abs((i % columns) - col) + Math.abs(Math.floor(i / columns) - row),
    }))
    .filter(({ c }) => {
      if (c.id === answerId) return false
      if (seedId && c.id === seedId) return false
      if (matchedWords.includes(c.word)) return false
      if (partialCards[c.word]?.includes(c.id)) return false
      if (c.word === targetWord) return false
      return true
    })
    .sort(
      (a, b) =>
        a.dist - b.dist ||
        wordSimilarity(b.c.word, targetWord) - wordSimilarity(a.c.word, targetWord),
    )
  // Pick up to five distractors, each a distinct word so there is exactly one
  // tile showing the target word.
  const chosen = []
  const usedWords = new Set([targetWord])
  for (const { c } of pool) {
    if (chosen.length >= MAX_DISTRACTORS) break
    if (usedWords.has(c.word)) continue
    usedWords.add(c.word)
    chosen.push(c.id)
  }
  return [answerId, ...chosen]
}

// Pick which of the two remaining copies of a word will be the answer in the
// cluster (prefer the one that can form a fuller cluster).
export function chooseAnswerId(
  cards,
  targetWord,
  seedId,
  { matchedWords = [], partialCards = {}, columns = BOARD_COLUMNS } = {},
) {
  const copies = cards.filter(
    (c) =>
      c.word === targetWord &&
      c.id !== seedId &&
      !matchedWords.includes(c.word) &&
      !partialCards[targetWord]?.includes(c.id),
  )
  if (copies.length === 0) return null
  if (copies.length === 1) return copies[0].id
  const first = buildCluster(cards, copies[0].id, targetWord, {
    seedId,
    matchedWords,
    partialCards,
    columns,
  }).length
  const second = buildCluster(cards, copies[1].id, targetWord, {
    seedId,
    matchedWords,
    partialCards,
    columns,
  }).length
  return first >= second ? copies[0].id : copies[1].id
}

// The board grid changes on mobile (4 columns portrait, 8 in short landscape),
// so compute the real column count to keep clusters visually tight everywhere.
export function getBoardColumns() {
  if (typeof window === 'undefined') return BOARD_COLUMNS
  if (window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches) return 8
  if (window.matchMedia('(max-width: 720px) and (orientation: portrait)').matches) return 4
  return BOARD_COLUMNS
}
