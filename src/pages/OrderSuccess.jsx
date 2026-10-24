import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react'
import ScrollReveal from '../components/ScrollReveal'

export default function OrderSuccess() {
  const { state } = useLocation()
  const orderId = state?.orderId
  const unlockedTutorialIds = state?.unlockedTutorialIds || []
  const hasTutorials = unlockedTutorialIds.length > 0
  const firstTutorialId = unlockedTutorialIds[0]

  return (
    <div className="container" style={{ padding: '120px 40px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <ScrollReveal y={28} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ marginBottom: '32px' }}
        >
          <CheckCircle size={80} color="var(--color-brand)" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontFamily: 'Playfair Display', fontSize: '48px', marginBottom: '16px', color: 'var(--color-text)' }}
        >
          {hasTutorials ? 'Tutorial unlocked!' : 'Thank you for your order!'}
        </motion.h1>

        {orderId && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-brand)', marginBottom: 12 }}
          >
            Order {orderId}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '500px', lineHeight: 1.6, marginBottom: '40px' }}
        >
          {hasTutorials
            ? 'Your payment proof is in. The tutorial is unlocked in My Learning.'
            : 'Your payment confirmation has been received. Our team will verify the transaction and begin crafting your beautiful pieces shortly.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {hasTutorials ? (
            <>
              <Link to={`/tutorial/${firstTutorialId}`}>
                <button type="button" style={{ padding: '16px 32px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}>
                  <BookOpen size={18} /> Open tutorial
                </button>
              </Link>
              <Link to="/learning">
                <button type="button" style={{ padding: '16px 32px', backgroundColor: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  My Learning <ArrowRight size={18} />
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/shop">
                <button type="button" style={{ padding: '16px 32px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}>
                  <ShoppingBag size={18} /> Continue Shopping
                </button>
              </Link>
              <Link to="/">
                <button type="button" style={{ padding: '16px 32px', backgroundColor: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Back to Home <ArrowRight size={18} />
                </button>
              </Link>
            </>
          )}
        </motion.div>
      </ScrollReveal>
    </div>
  )
}
