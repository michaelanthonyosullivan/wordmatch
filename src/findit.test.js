import { describe, expect, it } from 'vitest'
import {
  buildCluster,
  chooseAnswerId,
  wordSimilarity,
  MAX_DISTRACTORS,
} from './findit.js'

// Deterministic deck: word-N ids in a fixed grid layout.
function makeDeck(words, columns = 6) {
  const cards = []
  let index = 0
  for (const word of words) {
    for (let copy = 0; copy < 3; copy += 1) {
      cards.push({ id: `${word}-${copy}`, word, index })
      index += 1
    }
  }
  // Pad the deck to a multiple of the column count so grid math matches the
  // real 6x4 board.
  while (cards.length % columns !== 0) {
    cards.push({ id: `pad-${cards.length}`, word: 'pad', index: cards.length })
  }
  return cards
}

const WORDS = ['cat', 'car', 'cap', 'can', 'cup', 'cow', 'fox', 'owl']

describe('wordSimilarity', () => {
  it('scores words that share letters higher than unrelated words', () => {
    expect(wordSimilarity('cat', 'car')).toBeGreaterThan(wordSimilarity('cat', 'fox'))
    expect(wordSimilarity('cat', 'cap')).toBeGreaterThan(wordSimilarity('cat', 'owl'))
  })

  it('is symmetric', () => {
    expect(wordSimilarity('cat', 'car')).toBe(wordSimilarity('car', 'cat'))
  })

  it('gives an exact match the highest score', () => {
    const self = wordSimilarity('cat', 'cat')
    expect(self).toBeGreaterThan(wordSimilarity('cat', 'car'))
  })
})

describe('buildCluster', () => {
  const cards = makeDeck(WORDS)

  it('includes the answer tile first', () => {
    const cluster = buildCluster(cards, 'cat-0', 'cat')
    expect(cluster[0]).toBe('cat-0')
  })

  it('contains exactly one tile with the target word (the answer)', () => {
    const cluster = buildCluster(cards, 'cat-0', 'cat')
    const matches = cluster.filter((id) => {
      const c = cards.find((x) => x.id === id)
      return c.word === 'cat'
    })
    expect(matches).toHaveLength(1)
    expect(matches[0]).toBe('cat-0')
  })

  it('keeps distractor words distinct from each other and the target', () => {
    const cluster = buildCluster(cards, 'cat-0', 'cat')
    const distractors = cluster.slice(1)
    const words = distractors.map((id) => cards.find((x) => x.id === id).word)
    expect(words).toHaveLength(new Set(words).size) // all distinct
    words.forEach((w) => expect(w).not.toBe('cat'))
  })

  it('never exceeds one answer plus MAX_DISTRACTORS tiles', () => {
    const cluster = buildCluster(cards, 'cat-0', 'cat')
    expect(cluster.length).toBeLessThanOrEqual(1 + MAX_DISTRACTORS)
  })

  it('excludes the seed tile', () => {
    const cluster = buildCluster(cards, 'cat-0', 'cat', { seedId: 'cat-1' })
    expect(cluster).not.toContain('cat-1')
  })

  it('excludes already matched words and partial tiles', () => {
    const cluster = buildCluster(cards, 'cat-0', 'cat', {
      matchedWords: ['fox', 'owl'],
      partialCards: { car: ['car-0', 'car-1'] },
    })
    cluster.forEach((id) => {
      const c = cards.find((x) => x.id === id)
      expect(['fox', 'owl']).not.toContain(c.word)
      expect(id).not.toBe('car-0')
      expect(id).not.toBe('car-1')
    })
  })

  it('prefers tiles close to the answer (tight cluster), deduping words', () => {
    // cat-0 sits at grid position (0,0). Distractors must come from the
    // closest distinct-word tiles, never far-away ones when near ones exist.
    const cluster = buildCluster(cards, 'cat-0', 'cat')
    const distractors = cluster.slice(1)
    const distances = distractors.map((id) => {
      const c = cards.find((x) => x.id === id)
      return Math.abs(c.index % 6) + Math.floor(c.index / 6)
    })
    // All distractors are within 4 grid steps of the answer tile.
    distances.forEach((d) => expect(d).toBeLessThanOrEqual(4))
    // At least two tiles come from directly adjacent cells.
    expect(distances.filter((d) => d <= 2).length).toBeGreaterThanOrEqual(2)
  })
})

describe('chooseAnswerId', () => {
  const cards = makeDeck(WORDS)

  it('returns a copy of the target word that is not the seed', () => {
    const answerId = chooseAnswerId(cards, 'cat', 'cat-0')
    const c = cards.find((x) => x.id === answerId)
    expect(c.word).toBe('cat')
    expect(answerId).not.toBe('cat-0')
  })

  it('returns null when no other copy remains', () => {
    const answerId = chooseAnswerId(cards, 'cat', 'cat-0', {
      matchedWords: [],
      partialCards: { cat: ['cat-1', 'cat-2'] },
    })
    expect(answerId).toBeNull()
  })

  it('skips copies that are already revealed as partial', () => {
    const answerId = chooseAnswerId(cards, 'cat', 'cat-0', {
      partialCards: { cat: ['cat-1'] },
    })
    expect(answerId).toBe('cat-2')
  })
})
