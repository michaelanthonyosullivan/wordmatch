export default function Card({
  word,
  index,
  flipped,
  matched,
  result,
  disabled,
  onClick,
}) {
  const classes = [
    'card',
    flipped ? 'is-flipped' : '',
    matched ? 'is-matched' : '',
    result === 'match' ? 'is-success' : '',
    result === 'miss' ? 'is-miss' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      style={{ '--i': index }}
      onClick={onClick}
      disabled={disabled}
      aria-label={flipped ? word : 'Hidden card'}
      aria-pressed={flipped}
    >
      <span className="card-inner">
        <span className="face back" aria-hidden="true">
          <span className="sparkle">★</span>
        </span>
        <span className="face front">
          <span className="word">{word}</span>
        </span>
      </span>
    </button>
  )
}
