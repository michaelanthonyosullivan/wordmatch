// Pure helpers for the classic Easy/Hard game modes. These functions compute
// the outcome of a turn from the current state; the component applies the
// results (sounds, timeouts, state updates).

export const MATCH_SIZE = 3

// True when clicking this card instantly completes a word that already has its
// other two cards permanently revealed (Easy mode only).
export function completesPartialInstantly(card, partialCards) {
  return partialCards[card.word]?.length === 2
}

// Resolve a completed turn (exactly MATCH_SIZE cards flipped) for the classic
// modes. Returns the match outcome plus which words complete existing partials
// and which pairs form new partials.
export function resolveClassicTurn({
  flippedIds,
  cards,
  matchedWords,
  partialCards,
  mode,
}) {
  const words = flippedIds.map((id) => cards.find((item) => item.id === id).word)

  // Group the flipped card ids by word so we know exactly which ids form a pair.
  const idsByWord = {}
  flippedIds.forEach((id) => {
    const w = cards.find((item) => item.id === id).word
    idsByWord[w] = idsByWord[w] ? [...idsByWord[w], id] : [id]
  })

  const completingPartials = []
  const newPartialEntries = []

  if (mode === 'easy') {
    for (const [word, ids] of Object.entries(idsByWord)) {
      if (matchedWords.includes(word)) continue
      if (partialCards[word]?.length === 2) {
        completingPartials.push(word)
      } else if (ids.length === 2) {
        newPartialEntries.push({ word, ids })
      }
    }
  }

  const isMatch = words[0] === words[1] && words[1] === words[2]
  return {
    isMatch,
    completingPartials,
    newPartialEntries,
    hasFullMatch: isMatch || completingPartials.length > 0,
    hasPartialMatch: newPartialEntries.length > 0,
  }
}
