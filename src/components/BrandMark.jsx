import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/** Pre-cropped, dark-baked mark so pink reads at small sizes */
const EMBLEM_SRC = '/brand-emblem.png?v=5'

/**
 * Logo + wordmark as separate pieces.
 * variant: "header" | "footer" | "stacked"
 */
export default function BrandMark({ variant = 'header', to = '/', className = '' }) {
  const content = (
    <motion.span
      className={`brand-mark brand-mark--${variant} ${className}`.trim()}
      whileHover={variant === 'header' ? { y: -1 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <span className="brand-mark__emblem">
        <img src={EMBLEM_SRC} alt="" width={56} height={56} />
      </span>
      <span className="brand-mark__wordmark">
        <span className="brand-mark__name">Swarnaa</span>
        <span className="brand-mark__tag">Creations</span>
      </span>
    </motion.span>
  )

  if (!to) return content
  return (
    <Link to={to} className="brand-mark-link" aria-label="Swarnaa Creations home">
      {content}
    </Link>
  )
}
