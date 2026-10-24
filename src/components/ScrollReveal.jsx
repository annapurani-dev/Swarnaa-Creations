import { motion } from 'framer-motion'

/**
 * Fade in when entering the viewport, fade out when leaving.
 * Use throughout pages for a consistent scroll feel.
 */
export default function ScrollReveal({
  children,
  className = '',
  as = 'div',
  delay = 0,
  y = 32,
  once = false,
  amount = 0.28,
  style,
}) {
  const Comp = motion[as] || motion.div

  return (
    <Comp
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount, margin: '-12% 0px -12% 0px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  )
}
