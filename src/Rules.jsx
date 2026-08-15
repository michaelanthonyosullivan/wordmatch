import { useEffect } from 'react'
import Footer from './Footer.jsx'

export default function Rules({ onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="rules" role="dialog" aria-labelledby="rules-title">
      <div className="rules-card pop-in">
        <button
          type="button"
          className="rules-close"
          onClick={onClose}
          aria-label="Close rules"
        >
          ✕
        </button>

        <h2 id="rules-title">How to Play</h2>

        <section className="rules-section">
          <h3>🎯 The goal</h3>
          <p>
            Twenty-four cards start face down. Each hidden word appears on exactly three
            cards. Find all eight matching trios to win the game!
          </p>
        </section>

        <section className="rules-section">
          <h3>👆 Taking a turn</h3>
          <p>
            Tap a card to flip it, then tap two more. If all three show the same word,
            they stay face up. If they don't match, they flip back down after a moment so
            you can try again.
          </p>
        </section>

        <section className="rules-section">
          <h3>🎚️ Difficulty</h3>
          <div className="rules-demo">
            <div className="demo-card demo-matched" aria-hidden="true">
              <span className="demo-word">cat</span>
            </div>
            <p>
              <strong>Hard</strong> — only a full set of three matching cards stays
              revealed.
            </p>
          </div>
          <div className="rules-demo">
            <div className="demo-card demo-partial" aria-hidden="true">
              <span className="partial-badge">2/3</span>
              <span className="demo-word">cat</span>
            </div>
            <p>
              <strong>Easy</strong> — if two of your three cards match, they stay revealed
              in gold while you keep looking for the last one. Find it to turn the whole
              set green!
            </p>
          </div>
        </section>

        <section className="rules-section">
          <h3>🔍 Find it!</h3>
          <p>
            This mode is all about spotting the word yourself! Tap any card to flip it — a
            group of new cards opens up nearby, and only one of them shows the same word.
            You pick the match! Find the third card the same way to finish the set.
          </p>
        </section>

        <section className="rules-section">
          <h3>⭐ Stars &amp; tries</h3>
          <p>
            Each star lights up when a word is fully found. Tries count how many turns
            you've taken — try to finish in as few as you can!
          </p>
        </section>

        <button type="button" className="primary bounce" onClick={onClose}>
          Got it!
        </button>
        <Footer />
      </div>
    </div>
  )
}
