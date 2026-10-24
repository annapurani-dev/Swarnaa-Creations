import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Sparkles, Package, User, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ScrollReveal from '../components/ScrollReveal'

export default function CustomOrders() {
  const { isLoggedIn, openLoginModal } = useAuth()
  const toast = useToast()
  const [orderVolume, setOrderVolume] = useState('single') // 'single' or 'bulk'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      openLoginModal()
      return
    }
    toast.success('Thank you! Your custom inquiry has been sent. We will get back to you within 48 hours.')
  }

  return (
    <div className="page">
      <ScrollReveal className="page-banner" y={16}>
        <div className="page-banner__inner">
          <div>
            <h1 className="page-banner__title">Custom Commissions</h1>
            <p className="page-banner__lead">
              Bespoke pieces and bulk orders — share your vision and we&apos;ll craft it with you.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="container" style={{ maxWidth: 640, marginTop: 48 }}>
        <ScrollReveal y={22}>
        <form
          onSubmit={handleSubmit}
          className="surface"
          style={{ padding: 'clamp(28px, 4vw, 48px)', borderRadius: 'var(--radius-xl)' }}
        >
          
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>Let's create something beautiful</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>We can't wait to hear your ideas. Share your vision below!</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <label style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Order Volume:</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['single', 'bulk'].map(type => (
                  <button 
                    key={type} type="button"
                    onClick={() => setOrderVolume(type)}
                    style={{
                      padding: '8px 20px', borderRadius: '50px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize',
                      border: orderVolume === type ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                      backgroundColor: orderVolume === type ? 'rgba(122, 107, 143, 0.05)' : 'white',
                      color: orderVolume === type ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type === 'single' ? 'Single Piece' : 'Bulk Order'}
                  </button>
                ))}
              </div>
            </div>

            {orderVolume === 'bulk' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Quantity:</label>
                <input required type="number" min="2" defaultValue={5} style={{ width: '80px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', textAlign: 'center', backgroundColor: 'var(--color-cream)' }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Describe your custom vision
            </label>
            <textarea required placeholder="Please provide details about what you want us to create..." style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Reference Images (Optional)
            </label>
            <div style={{ padding: '24px', border: '2px dashed var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-lavender-light)', textAlign: 'center', cursor: 'pointer' }}>
              <input type="file" multiple accept="image/*" style={{ display: 'none' }} id="file-upload" />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', color: 'var(--color-brand)', fontSize: '14px', fontWeight: 500, display: 'block', width: '100%' }}>
                Click to upload sketches or reference photos
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Phone Number (Optional)</label>
              <input type="tel" placeholder="+91 98765 43210" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Required By (Deadline)</label>
              <input required type="date" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Expected Quotation (₹)</label>
              <input required type="text" placeholder="e.g., 5000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit"
            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-text)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Mail size={18} /> Submit Request
          </motion.button>
        </form>
        </ScrollReveal>

      </div>
    </div>
  )
}
