import { useEffect, useState } from 'react'
import { createDeck, pickWords } from './words.js'
import { MATCH_SIZE, completesPartialInstantly, resolveClassicTurn } from './game.js'
import { buildCluster, chooseAnswerId, getBoardColumns } from './findit.js'
import Card from './Card.jsx'
import Celebration from './Celebration.jsx'
import Rules from './Rules.jsx'
import Footer from './Footer.jsx'
import { playFlip, playMatch, playMiss, playWin, setMuted } from './sounds.js'

const FLIP_BACK_MS = 1100
const CHEERS = [
  'Nice!',
  'Yes!',
  'Great!',
  'Wow!',
  'Super!',
  'Amazing!',
  'Fantastic!',
  'You did it!',
]

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
  // 'hard' | 'easy' | 'findit' — the three game modes.
  const [mode, setMode] = useState('hard')
  // Easy mode only: word -> the exact 2 card ids already permanently revealed for it.
  const [partialCards, setPartialCards] = useState({})
  const [showRules, setShowRules] = useState(false)
  // Find it! mode state.
  const [findSeedId, setFindSeedId] = useState(null) // tile the child clicked to start a hunt
  const [clusterIds, setClusterIds] = useState([]) // tiles opened up around the answer
  const [missId, setMissId] = useState(null) // tile briefly revealed after a wrong pick

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

    if (mode === 'findit') {
      handleFindItClick(card)
      return
    }

    // Easy mode: if this click completes an already-partial word (2 of its 3
    // cards are already permanently revealed), resolve it instantly rather than
    // waiting for a full group of 3 picks — children need immediate feedback.
    // This applies whether the completing card is the 1st or 2nd pick of the
    // current group; any other card already mid-pick is left untouched and
    // still waits for its own group to fill up. If this card happens to be the
    // 3rd (final) pick of the group, the normal evaluation below already
    // resolves it immediately, so no special-casing is needed there.
    if (
      mode === 'easy' &&
      flippedIds.length < MATCH_SIZE - 1 &&
      completesPartialInstantly(card, partialCards)
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

    const turn = resolveClassicTurn({
      flippedIds: nextFlipped,
      cards,
      matchedWords,
      partialCards,
      mode,
    })
    const {
      isMatch,
      matchWord,
      completingPartials,
      newPartialEntries,
      hasFullMatch,
      hasPartialMatch,
    } = turn

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
      setToast('Great pair!')
    } else {
      setResult('miss')
      playMiss()
    }

    window.setTimeout(
      () => {
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
          if (isMatch && matchWord) {
            setMatchedWords((current) =>
              current.includes(matchWord) ? current : [...current, matchWord],
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
      },
      hasFullMatch ? 650 : FLIP_BACK_MS,
    )
  }

  // ---- Find it! mode ----

  function handleFindItClick(card) {
    if (locked || isWon) return
    if (matchedWords.includes(card.word)) return
    if (missId === card.id) return

    // No cluster open yet → this click chooses the seed word to hunt.
    if (clusterIds.length === 0) {
      if (Object.keys(partialCards).length > 0) return
      playFlip(0)
      const seedId = card.id
      const answerId = chooseAnswerId(cards, card.word, seedId, {
        matchedWords,
        partialCards,
        columns: getBoardColumns(),
      })
      if (answerId) {
        setFindSeedId(seedId)
        setClusterIds(
          buildCluster(cards, answerId, card.word, {
            seedId,
            matchedWords,
            partialCards,
            columns: getBoardColumns(),
          }),
        )
      }
      return
    }

    // A cluster is open → the child must pick the tile matching the target word.
    const targetWord = findSeedId
      ? cards.find((c) => c.id === findSeedId).word
      : Object.keys(partialCards)[0]

    // Wrong pick: gently reveal the tile, then flip it back; keep trying.
    if (card.word !== targetWord) {
      setTries((count) => count + 1)
      setMissId(card.id)
      setClusterIds((current) => current.filter((id) => id !== card.id))
      playMiss()
      setToast('Try again!')
      window.setTimeout(() => {
        setMissId((id) => (id === card.id ? null : id))
      }, 550)
      return
    }

    // Correct pick.
    setTries((count) => count + 1)
    setLocked(true)

    if (findSeedId) {
      // Found the second copy — reveal the pair in gold, then open a fresh
      // cluster so the child can find the third copy themselves.
      const seedId = findSeedId
      const word = targetWord
      playMatch()
      setToast('Great pair!')
      window.setTimeout(() => {
        setPartialCards({ [word]: [seedId, card.id] })
        setFindSeedId(null)
        const remaining = cards.find(
          (c) => c.word === word && c.id !== seedId && c.id !== card.id,
        )
        setClusterIds(
          remaining
            ? buildCluster(cards, remaining.id, word, {
                matchedWords,
                partialCards,
                columns: getBoardColumns(),
              })
            : [],
        )
        setLocked(false)
      }, 1100)
    } else {
      // Found the third copy — the whole set is now matched.
      const word = targetWord
      playMatch()
      setToast(CHEERS[matchedWords.length] ?? 'Yes!')
      if (matchedWords.length === 7) {
        window.setTimeout(() => playWin(), 350)
      }
      window.setTimeout(() => {
        setPartialCards({})
        setMatchedWords((current) =>
          current.includes(word) ? current : [...current, word],
        )
        setClusterIds([])
        setLocked(false)
      }, 650)
    }
  }

  function startRound(nextWords = wordSet) {
    setWordSet(nextWords)
    setCards(createDeck(nextWords))
    setFlippedIds([])
    setMatchedWords([])
    setPartialCards({})
    setFindSeedId(null)
    setClusterIds([])
    setMissId(null)
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
              className={`ghost ${mode === 'easy' ? 'active' : ''}`}
              onClick={() => {
                setMode('easy')
                startRound(wordSet)
              }}
              aria-pressed={mode === 'easy'}
            >
              Easy
            </button>
            <button
              type="button"
              className={`ghost ${mode === 'hard' ? 'active' : ''}`}
              onClick={() => {
                setMode('hard')
                startRound(wordSet)
              }}
              aria-pressed={mode === 'hard'}
            >
              Hard
            </button>
            <button
              type="button"
              className={`ghost ${mode === 'findit' ? 'active' : ''}`}
              onClick={() => {
                setMode('findit')
                startRound(wordSet)
              }}
              aria-pressed={mode === 'findit'}
            >
              Find it!
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
            <button type="button" className="ghost" onClick={() => setShowRules(true)}>
              Rules
            </button>
          </div>
        </div>
      </header>

      <main className="board" aria-label="Word matching cards" key={round}>
        {cards.map((card, index) => {
          const isMatched = matchedWords.includes(card.word)
          const isPartial =
            !isMatched && Boolean(partialCards[card.word]?.includes(card.id))
          // In Find it! the reference for the current hunt is either the seed
          // tile or, once a pair is found, the gold pair itself — keep the
          // seed ring on it so the child knows what word to look for.
          const isSeed =
            mode === 'findit' &&
            (card.id === findSeedId ||
              (findSeedId === null &&
                Object.keys(partialCards).length > 0 &&
                partialCards[card.word]?.includes(card.id)))
          const isCluster = mode === 'findit' && clusterIds.includes(card.id)
          const isMiss = mode === 'findit' && card.id === missId
          const isFlipped =
            isMatched ||
            flippedIds.includes(card.id) ||
            isPartial ||
            isSeed ||
            isCluster ||
            isMiss
          // In Find it! the seed stays disabled (it's the reference card), but
          // cluster tiles are face-up yet still tappable; nothing else on the
          // board can be tapped while a cluster is open.
          const disabled =
            locked ||
            isWon ||
            (isFlipped && !isCluster) ||
            (mode === 'findit' && clusterIds.length > 0 && !isCluster)
          return (
            <Card
              key={card.id}
              word={card.word}
              index={index}
              flipped={isFlipped}
              matched={isMatched}
              isPartial={isPartial}
              isSeed={isSeed}
              result={isFlipped ? (isMiss ? 'miss' : result) : null}
              disabled={disabled}
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

      {showRules && <Rules onClose={() => setShowRules(false)} />}

      <Footer />
    </div>
  )
}
