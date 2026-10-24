import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Large circle with a sequential slideshow.
 */
export default function HeroOrbit({ images = [], intervalMs = 3600 }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (images.length < 2) return undefined
    const id = setInterval(() => {
      setActive((n) => (n + 1) % images.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [images.length, intervalMs])

  if (!images.length) return null

  const src = images[active]

  return (
    <div className="hero-orbit" aria-hidden="true">
      <div className="hero-orbit__slot">
        <AnimatePresence mode="wait">
          <motion.img
            key={src}
            src={src}
            alt=""
            className="hero-orbit__img"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
      </div>
    </div>
  )
}
