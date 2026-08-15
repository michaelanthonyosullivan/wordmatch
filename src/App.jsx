import { useEffect, useState } from 'react'
import { createDeck, pickWords } from './words.js'
import Card from './Card.jsx'
import Celebration from './Celebration.jsx'
import Rules from './Rules.jsx'
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
const CHEERS = ['Nice!', 'Yes!', 'Great!', 'Wow!', 'Super!', 'Amazing!', 'Fantastic!', 'You did it!']

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
      setToast('Great pair!')
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

  // ---- Find it! mode ----

  // How visually alike two words are, so we can pick distractors that force a
  // child to actually look at letter shapes instead of scanning first letters.
  function wordSimilarity(a, b) {
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
  // exactly one matching tile in the cluster. seedId is passed explicitly so
  // the seed is never selected as an answer even though the state update is
  // asynchronous.
  function buildCluster(answerId, targetWord, seedId = null) {
    const answerIndex = cards.findIndex((c) => c.id === answerId)
    const col = answerIndex % 6
    const row = Math.floor(answerIndex / 6)
    const pool = cards
      .map((c, i) => ({
        c,
        dist: Math.abs((i % 6) - col) + Math.abs(Math.floor(i / 6) - row),
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
          wordSimilarity(b.c.word, targetWord) -
            wordSimilarity(a.c.word, targetWord),
      )
    // Pick up to five distractors, each a distinct word so there is exactly
    // one tile showing the target word.
    const chosen = []
    const usedWords = new Set([targetWord])
    for (const { c } of pool) {
      if (chosen.length >= 5) break
      if (usedWords.has(c.word)) continue
      usedWords.add(c.word)
      chosen.push(c.id)
    }
    return [answerId, ...chosen]
  }

  // Pick which of the two remaining copies of a word will be the answer in the
  // cluster (prefer the one that can form a fuller cluster).
  function chooseAnswerId(targetWord, seedId) {
    const copies = cards.filter(
      (c) =>
        c.word === targetWord &&
        c.id !== seedId &&
        !matchedWords.includes(c.word) &&
        !partialCards[targetWord]?.includes(c.id),
    )
    if (copies.length === 0) return null
    if (copies.length === 1) return copies[0].id
    const first = buildCluster(copies[0].id, targetWord, seedId).length
    const second = buildCluster(copies[1].id, targetWord, seedId).length
    return first >= second ? copies[0].id : copies[1].id
  }

  function handleFindItClick(card) {
    if (locked || isWon) return
    if (matchedWords.includes(card.word)) return
    if (missId === card.id) return

    // No cluster open yet → this click chooses the seed word to hunt.
    if (clusterIds.length === 0) {
      if (Object.keys(partialCards).length > 0) return
      playFlip(0)
      const seedId = card.id
      const answerId = chooseAnswerId(card.word, seedId)
      if (answerId) {
        setFindSeedId(seedId)
        setClusterIds(buildCluster(answerId, card.word, seedId))
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
        setClusterIds(remaining ? buildCluster(remaining.id, word) : [])
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
              onClick={() => { setMode('easy'); startRound(wordSet) }}
              aria-pressed={mode === 'easy'}
            >
              Easy
            </button>
            <button
              type="button"
              className={`ghost ${mode === 'hard' ? 'active' : ''}`}
              onClick={() => { setMode('hard'); startRound(wordSet) }}
              aria-pressed={mode === 'hard'}
            >
              Hard
            </button>
            <button
              type="button"
              className={`ghost ${mode === 'findit' ? 'active' : ''}`}
              onClick={() => { setMode('findit'); startRound(wordSet) }}
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
            <button
              type="button"
              className="ghost"
              onClick={() => setShowRules(true)}
            >
              Rules
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
            isMatched || flippedIds.includes(card.id) || isPartial ||
            isSeed || isCluster || isMiss
          // In Find it! the seed stays disabled (it's the reference card), but
          // cluster tiles are face-up yet still tappable; nothing else on the
          // board can be tapped while a cluster is open.
          const disabled =
            locked || isWon ||
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
