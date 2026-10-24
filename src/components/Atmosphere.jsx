/** Sparkle rain — denser field, behind page content via parent isolation */
const COUNT = 36

const SPARKLES = Array.from({ length: COUNT }, (_, i) => {
  const col = i % 12
  const row = Math.floor(i / 12)
  const left = 3 + col * 8 + (row % 2 === 0 ? 0 : 3.5) + (i % 5) * 0.4
  const duration = 11 + (i % 9) * 1.1
  const delay = -((i * 1.7) % 22)
  const s = 0.55 + (i % 7) * 0.18
  return {
    left: `${Math.min(left, 97)}%`,
    duration: `${duration}s`,
    delay: `${delay}s`,
    s: Number(s.toFixed(2)),
  }
})

export default function Atmosphere() {
  return (
    <div className="sc-rain" aria-hidden="true">
      {SPARKLES.map((sparkle, i) => (
        <span
          key={i}
          className="sc-raindrop"
          style={{
            left: sparkle.left,
            animationDuration: sparkle.duration,
            animationDelay: sparkle.delay,
            '--s': sparkle.s,
          }}
        />
      ))}
    </div>
  )
}
