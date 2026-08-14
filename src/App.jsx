import { useEffect, useState } from 'react'
import { createDeck, pickWords } from './words.js'
import Card from './Card.jsx'
import Celebration from './Celebration.jsx'
import Footer from './Footer.jsx'
import {
  playFlip,
  playMatch,
  playMiss,
  playWin,
  setMuted,
} from './sounds.js'

const MATCH_SIZE = 3
const FLIP_BACK_MS = 1100
const CHEERS = ['Nice!', 'Yes!', 'Great!', 'Wow!', 'Super!', 'Amazing!', 'Almost!', 'You did it!']

export default function App() {
  const [wordSet, setWordSet] = useState(() => pickWords())
  const [cards, setCards] = useState(() => createDeck(wordSet))
  const [flippedIds, setFlippedIds] = useState([])
  const [matchedWords, setMatchedWords] = useState([])
  const [locked, setLocked] = useState(false)
  const [tries, setTries] = useState(0)
  const [round, setRound] = useState(0)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState('')
  const [soundOn, setSoundOn] = useState(true)
  const [difficulty, setDifficulty] = useState('hard')
  // Easy mode only: word -> the exact 2 card ids already permanently revealed for it.
  const [partialCards, setPartialCards] = useState({})

  const matchedCount = matchedWords.length
  const isWon = matchedCount === 8

  useEffect(() => {
    setMuted(!soundOn)
  }, [soundOn])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 900)
    return () => window.clearTimeout(timer)
  }, [toast])

  function handleCardClick(card) {
    if (locked || isWon) return
    if (flippedIds.includes(card.id)) return
    if (matchedWords.includes(card.word)) return

    // Easy mode: if this click completes an already-partial word (2 of its 3
    // cards are already permanently revealed), resolve it instantly rather than
    // waiting for a full group of 3 picks — children need immediate feedback.
    // This applies whether the completing card is the 1st or 2nd pick of the
    // current group; any other card already mid-pick is left untouched and
    // still waits for its own group to fill up. If this card happens to be the
    // 3rd (final) pick of the group, the normal evaluation below already
    // resolves it immediately, so no special-casing is needed there.
    if (
      difficulty === 'easy' &&
      flippedIds.length < MATCH_SIZE - 1 &&
      partialCards[card.word]?.length === 2
    ) {
      setLocked(true)
      setTries((count) => count + 1)
      playFlip(flippedIds.length)
      setFlippedIds((current) => [...current, card.id])

      setResult('match')
      playMatch()
      setToast(CHEERS[matchedCount] ?? 'Yes!')
      if (matchedCount === 7) {
        window.setTimeout(() => playWin(), 350)
      }

      window.setTimeout(() => {
        setPartialCards((current) => {
          const next = { ...current }
          delete next[card.word]
          return next
        })
        setMatchedWords((current) =>
          current.includes(card.word) ? current : [...current, card.word],
        )
        setFlippedIds((current) => current.filter((id) => id !== card.id))
        setResult(null)
        setLocked(false)
      }, 650)
      return
    }

    if (flippedIds.length >= MATCH_SIZE) return

    const nextFlipped = [...flippedIds, card.id]
    setFlippedIds(nextFlipped)
    playFlip(nextFlipped.length - 1)

    if (nextFlipped.length < MATCH_SIZE) return

    setLocked(true)
    setTries((count) => count + 1)

    const words = nextFlipped.map(
      (id) => cards.find((item) => item.id === id).word,
    )

    // Group the flipped card ids by word so we know exactly which ids form a pair.
    const idsByWord = {}
    nextFlipped.forEach((id) => {
      const w = cards.find((item) => item.id === id).word
      idsByWord[w] = idsByWord[w] ? [...idsByWord[w], id] : [id]
    })

    const completingPartials = []
    const newPartialEntries = []

    if (difficulty === 'easy') {
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
    const hasFullMatch = isMatch || completingPartials.length > 0
    const hasPartialMatch = newPartialEntries.length > 0

    if (hasFullMatch) {
      setResult('match')
      playMatch()
      setToast(CHEERS[matchedCount] ?? 'Yes!')
      if (matchedCount === 7) {
        window.setTimeout(() => playWin(), 350)
      }
    } else if (hasPartialMatch) {
      setResult(null)
      playMatch()
      setToast('Almost!')
    } else {
      setResult('miss')
      playMiss()
    }

    window.setTimeout(() => {
      if (hasFullMatch) {
        completingPartials.forEach((word) => {
          setPartialCards((current) => {
            const next = { ...current }
            delete next[word]
            return next
          })
          setMatchedWords((current) =>
            current.includes(word) ? current : [...current, word],
          )
        })
        if (isMatch) {
          setMatchedWords((current) =>
            current.includes(words[0]) ? current : [...current, words[0]],
          )
        }
      }
      if (hasPartialMatch) {
        newPartialEntries.forEach(({ word, ids }) => {
          setPartialCards((current) => ({ ...current, [word]: ids }))
        })
      }
      setFlippedIds([])
      setResult(null)
      setLocked(false)
    }, hasFullMatch ? 650 : FLIP_BACK_MS)
  }

  function startRound(nextWords = wordSet) {
    setWordSet(nextWords)
    setCards(createDeck(nextWords))
    setFlippedIds([])
    setMatchedWords([])
    setPartialCards({})
    setLocked(false)
    setTries(0)
    setResult(null)
    setToast('')
    setRound((value) => value + 1)
  }

  function handlePlayAgain() {
    startRound(wordSet)
  }

  function handleNewWords() {
    startRound(pickWords(wordSet))
  }

  return (
    <div className="page">
      <div className="sky" aria-hidden="true">
        <span className="cloud c1" />
        <span className="cloud c2" />
        <span className="cloud c3" />
        <span className="sun-glow" />
      </div>

      <header className="top">
        <div className="brand">
          <p className="eyebrow">Find three the same</p>
          <h1>Word Match</h1>
        </div>
        <div className="toolbar">
          <div className="meters">
            <div className="stat stars" aria-label={`${matchedCount} of 8 matches`}>
              <span className="stat-label">Stars</span>
              <span className="star-row">
                {Array.from({ length: 8 }, (_, index) => (
                  <span
                    key={index}
                    className={index < matchedCount ? 'star is-lit' : 'star'}
                  >
                    ★
                  </span>
                ))}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Tries</span>
              <span className="stat-value">{tries}</span>
            </div>
          </div>
          <div className="actions">
            <button
              type="button"
              className={`ghost ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => { setDifficulty('easy'); startRound(wordSet) }}
              aria-pressed={difficulty === 'easy'}
            >
              Easy
            </button>
            <button
              type="button"
              className={`ghost ${difficulty === 'hard' ? 'active' : ''}`}
              onClick={() => { setDifficulty('hard'); startRound(wordSet) }}
              aria-pressed={difficulty === 'hard'}
            >
              Hard
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setSoundOn((on) => !on)}
              aria-pressed={soundOn}
            >
              {soundOn ? 'Sound on' : 'Sound off'}
            </button>
            <button type="button" className="ghost" onClick={handlePlayAgain}>
              New game
            </button>
            <button type="button" className="ghost" onClick={handleNewWords}>
              New words
            </button>
          </div>
        </div>
      </header>

      <main className="board" aria-label="Word matching cards" key={round}>
        {cards.map((card, index) => {
          const isMatched = matchedWords.includes(card.word)
          const isPartial =
            !isMatched &&
            Boolean(partialCards[card.word]?.includes(card.id))
          const isFlipped =
            isMatched || flippedIds.includes(card.id) || isPartial
          return (
            <Card
              key={card.id}
              word={card.word}
              index={index}
              flipped={isFlipped}
              matched={isMatched}
              isPartial={isPartial}
              result={isFlipped ? result : null}
              disabled={locked || isFlipped || isWon}
              onClick={() => handleCardClick(card)}
            />
          )
        })}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {isWon && <Celebration tries={tries} onPlayAgain={handlePlayAgain} />}

      <Footer />
    </div>
  )
}
