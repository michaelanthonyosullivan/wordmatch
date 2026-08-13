let audioCtx
let muted = false

export function setMuted(next) {
  muted = next
}

function context() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone({
  frequency,
  start = 0,
  duration = 0.18,
  type = 'triangle',
  gain = 0.07,
  slideTo,
}) {
  if (muted) return
  const ctx = context()
  const when = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, when)
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, when + duration)
  }

  amp.gain.setValueAtTime(0.0001, when)
  amp.gain.exponentialRampToValueAtTime(gain, when + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration)

  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + duration + 0.02)
}

export function playFlip(step) {
  const notes = [392, 440, 523]
  playTone({ frequency: notes[step] ?? 523, duration: 0.12, type: 'sine', gain: 0.05 })
}

export function playMatch() {
  playTone({ frequency: 523, duration: 0.14, type: 'triangle', gain: 0.07 })
  playTone({ frequency: 659, start: 0.1, duration: 0.14, type: 'triangle', gain: 0.07 })
  playTone({ frequency: 784, start: 0.2, duration: 0.22, type: 'triangle', gain: 0.08 })
}

export function playMiss() {
  playTone({
    frequency: 330,
    slideTo: 196,
    duration: 0.28,
    type: 'sine',
    gain: 0.04,
  })
}

export function playWin() {
  const fanfare = [523, 659, 784, 1046, 784, 1046]
  fanfare.forEach((frequency, index) => {
    playTone({
      frequency,
      start: index * 0.12,
      duration: 0.28,
      type: 'triangle',
      gain: 0.08,
    })
  })
}
