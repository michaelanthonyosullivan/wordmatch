import { describe, expect, it } from 'vitest'
import { completesPartialInstantly, resolveClassicTurn } from './game.js'

function makeDeck(words) {
  const cards = []
  for (const word of words) {
    for (let copy = 0; copy < 3; copy += 1) {
      cards.push({ id: `${word}-${copy}`, word })
    }
  }
  return cards
}

const CARDS = makeDeck(['cat', 'dog', 'fox', 'owl', 'hen', 'egg', 'ant', 'bug'])

function turn({ flippedIds, matchedWords = [], partialCards = {}, mode = 'hard' }) {
  return resolveClassicTurn({
    flippedIds,
    cards: CARDS,
    matchedWords,
    partialCards,
    mode,
  })
}

describe('completesPartialInstantly', () => {
  it('is true when exactly two cards of the word are already revealed', () => {
    expect(completesPartialInstantly({ word: 'cat' }, { cat: ['cat-0', 'cat-1'] })).toBe(
      true,
    )
  })

  it('is false when no partial match exists', () => {
    expect(completesPartialInstantly({ word: 'cat' }, {})).toBe(false)
  })
})

describe('resolveClassicTurn — full match', () => {
  it('detects three of a kind and reports the matched word', () => {
    const r = turn({ flippedIds: ['cat-0', 'cat-1', 'cat-2'] })
    expect(r.isMatch).toBe(true)
    expect(r.hasFullMatch).toBe(true)
    expect(r.hasPartialMatch).toBe(false)
    expect(r.matchWord).toBe('cat')
  })

  it('reports no matchWord for a miss', () => {
    const r = turn({ flippedIds: ['cat-0', 'dog-0', 'fox-0'] })
    expect(r.matchWord).toBeNull()
  })
})

describe('resolveClassicTurn — misses', () => {
  it('is a miss when all three cards differ', () => {
    const r = turn({ flippedIds: ['cat-0', 'dog-0', 'fox-0'] })
    expect(r.isMatch).toBe(false)
    expect(r.hasFullMatch).toBe(false)
    expect(r.hasPartialMatch).toBe(false)
  })
})

describe('resolveClassicTurn — easy partials', () => {
  it('records a new partial when exactly two cards match (easy mode)', () => {
    const r = turn({
      flippedIds: ['cat-0', 'cat-1', 'dog-0'],
      mode: 'easy',
    })
    expect(r.hasPartialMatch).toBe(true)
    expect(r.hasFullMatch).toBe(false)
    expect(r.newPartialEntries).toEqual([{ word: 'cat', ids: ['cat-0', 'cat-1'] }])
  })

  it('does not create partials in hard mode', () => {
    const r = turn({ flippedIds: ['cat-0', 'cat-1', 'dog-0'], mode: 'hard' })
    expect(r.hasPartialMatch).toBe(false)
  })

  it('completes an existing partial when its third card appears', () => {
    const r = turn({
      flippedIds: ['cat-2', 'dog-0', 'fox-0'],
      mode: 'easy',
      partialCards: { cat: ['cat-0', 'cat-1'] },
    })
    expect(r.hasFullMatch).toBe(true)
    expect(r.completingPartials).toEqual(['cat'])
  })
})
