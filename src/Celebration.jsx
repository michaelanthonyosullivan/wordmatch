import { useMemo } from 'react'
import Footer from './Footer.jsx'

const COLORS = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#8338ec', '#ff8a65', '#fff']
const CHEERS = ['Hooray!', 'Brilliant!', 'You did it!', 'Super star!']

function makePieces() {
  return Array.from({ length: 90 }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 0.9,
    duration: 2.4 + Math.random() * 2.2,
    color: COLORS[id % COLORS.length],
    rotate: Math.random() * 360,
    size: 8 + Math.random() * 12,
    kind: id % 4 === 0 ? 'circle' : id % 4 === 1 ? 'ribbon' : 'square',
    sway: 20 + Math.random() * 40,
  }))
}

export default function Celebration({ tries, onPlayAgain }) {
  const pieces = useMemo(makePieces, [])
  const title = tries <= 12 ? CHEERS[0] : CHEERS[tries % CHEERS.length]

  return (
    <div className="win" role="dialog" aria-labelledby="win-title">
      <div className="confetti" aria-hidden="true">
        {pieces.map((piece) => (
          <span
            key={piece.id}
            className={`confetti-piece is-${piece.kind}`}
            style={{
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.kind === 'ribbon' ? piece.size * 2.2 : piece.size,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              '--sway': `${piece.sway}px`,
              '--spin': `${piece.rotate}deg`,
            }}
          />
        ))}
      </div>

      <div className="balloons" aria-hidden="true">
        <span className="balloon is-pink">🎈</span>
        <span className="balloon is-blue">🎈</span>
        <span className="balloon is-yellow">🎉</span>
        <span className="balloon is-green">🎈</span>
      </div>

      <div className="win-card pop-in">
        <div className="burst" aria-hidden="true">
          <span>⭐</span>
          <span>✨</span>
          <span>🌟</span>
        </div>
        <p className="win-emoji" aria-hidden="true">
          🏆
        </p>
        <h2 id="win-title">{title}</h2>
        <p>
          You matched all 24 cards in <strong>{tries}</strong> tries.
        </p>
        <button type="button" className="primary bounce" onClick={onPlayAgain}>
          Play again
        </button>
        <Footer />
      </div>
    </div>
  )
}
