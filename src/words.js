export const WORD_BANK = [
  'ant',
  'bag',
  'bat',
  'bed',
  'bee',
  'box',
  'bug',
  'bun',
  'bus',
  'can',
  'cap',
  'car',
  'cat',
  'cow',
  'cub',
  'cup',
  'dad',
  'day',
  'den',
  'dog',
  'ear',
  'egg',
  'fan',
  'fig',
  'fox',
  'fun',
  'hat',
  'hen',
  'hop',
  'hug',
  'jam',
  'jet',
  'kid',
  'kit',
  'leg',
  'lid',
  'log',
  'map',
  'mat',
  'mud',
  'net',
  'owl',
  'pan',
  'pen',
  'pet',
  'pig',
  'pot',
  'rat',
  'red',
  'run',
  'sad',
  'sit',
  'sun',
  'tap',
  'ten',
  'top',
  'toy',
  'van',
  'web',
  'wet',
  'win',
  'yes',
  'zoo',
]

export const SET_SIZE = 8
export const COPIES_PER_WORD = 3

function shuffle(items) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function pickWords(exclude = []) {
  const fresh = WORD_BANK.filter((word) => !exclude.includes(word))
  const pool = fresh.length >= SET_SIZE ? fresh : WORD_BANK
  return shuffle(pool).slice(0, SET_SIZE)
}

export function createDeck(words) {
  const set = words ?? pickWords()
  const cards = set.flatMap((word) =>
    Array.from({ length: COPIES_PER_WORD }, (_, copy) => ({
      id: `${word}-${copy}-${crypto.randomUUID()}`,
      word,
    })),
  )
  return shuffle(cards)
}
