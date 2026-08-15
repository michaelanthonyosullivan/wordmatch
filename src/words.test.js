import { describe, expect, it } from 'vitest'
import {
  WORD_BANK,
  SET_SIZE,
  COPIES_PER_WORD,
  pickWords,
  createDeck,
} from './words.js'

describe('pickWords', () => {
  it('returns SET_SIZE unique words from the bank', () => {
    const words = pickWords()
    expect(words).toHaveLength(SET_SIZE)
    expect(new Set(words).size).toBe(SET_SIZE)
    words.forEach((w) => expect(WORD_BANK).toContain(w))
  })

  it('avoids excluded words when enough remain in the bank', () => {
    const excluded = WORD_BANK.slice(0, SET_SIZE)
    const words = pickWords(excluded)
    expect(words).toHaveLength(SET_SIZE)
    words.forEach((w) => expect(excluded).not.toContain(w))
  })

  it('falls back to the full bank when the pool is too small', () => {
    const words = pickWords(WORD_BANK)
    expect(words).toHaveLength(SET_SIZE)
  })
})

describe('createDeck', () => {
  const set = ['cat', 'dog', 'fox', 'owl', 'hen', 'egg', 'ant', 'bug']

  it('creates SET_SIZE * COPIES_PER_WORD cards', () => {
    const deck = createDeck(set)
    expect(deck).toHaveLength(SET_SIZE * COPIES_PER_WORD)
  })

  it('gives every word exactly COPIES_PER_WORD cards', () => {
    const deck = createDeck(set)
    set.forEach((word) => {
      expect(deck.filter((c) => c.word === word)).toHaveLength(COPIES_PER_WORD)
    })
  })

  it('gives every card a unique id', () => {
    const deck = createDeck(set)
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length)
  })
})
