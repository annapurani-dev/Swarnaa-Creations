import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Sparkles, Package, MessageCircle, Paperclip, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ScrollReveal from '../components/ScrollReveal'
import { submitCustomRequest } from '../api'
import { whatsappUrl } from '../lib/whatsapp'

export default function CustomOrders() {
  const { isLoggedIn, user, openLoginModal } = useAuth()
  const toast = useToast()
  
  const [orderVolume, setOrderVolume] = useState('single') // 'single' or 'bulk'
  const [quantity, setQuantity] = useState(1)
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).slice(0, 5))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      openLoginModal()
      return
    }

    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('customerName', user?.name || 'Customer')
      data.append('customerEmail', user?.email || '')
      data.append('customerPhone', phone)
      data.append('orderVolume', orderVolume)
      data.append('quantity', String(orderVolume === 'bulk' ? (quantity || 5) : 1))
      data.append('description', description)
      data.append('deadline', deadline)
      data.append('budget', budget)
      files.forEach((f) => data.append('referenceImages', f))

      const result = await submitCustomRequest(data)
      setSubmittedRequest(result)
      toast.success('Your custom commission inquiry has been submitted! Our studio will review it shortly.')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to submit inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
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

      <div className="container" style={{ maxWidth: 680, marginTop: 48, marginBottom: 80 }}>
        <ScrollReveal y={22}>
          {submittedRequest ? (
            <div
              className="surface"
              style={{
                padding: 'clamp(28px, 4vw, 48px)',
                borderRadius: 'var(--radius-xl)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#10B981',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 20px'
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>
                Inquiry Received!
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Your request <strong>{submittedRequest.requestId}</strong> has been logged in our studio database. We will review your vision and follow up within 24–48 hours.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                <a
                  href={whatsappUrl(`Hi Swarnaa Creations! I just submitted a custom order inquiry (${submittedRequest.requestId}): "${submittedRequest.description.slice(0, 80)}..."`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    borderRadius: 50,
                    backgroundColor: '#25D366',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none'
                  }}
                >
                  <MessageCircle size={18} /> Chat with us on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRequest(null)
                    setDescription('')
                    setFiles([])
                    setDeadline('')
                    setBudget('')
                  }}
                  className="btn-ghost"
                  style={{ padding: '12px 24px', borderRadius: 50 }}
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="surface"
              style={{ padding: 'clamp(28px, 4vw, 48px)', borderRadius: 'var(--radius-xl)' }}
            >
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>
                  Let's create something beautiful
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                  We can't wait to hear your ideas. Share your vision below!
                </p>
              </div>

              {/* Order Volume Toggle */}
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
                    <input
                      required
                      type="number"
                      min="2"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      style={{ width: '80px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', textAlign: 'center', backgroundColor: 'var(--color-cream)' }}
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  Describe your custom vision *
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about colors, themes, occasions, or materials you want us to create..."
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              
              {/* Reference Photos */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  Reference Images (Optional - up to 5 photos)
                </label>
                <div style={{ padding: '24px', border: '2px dashed var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-lavender-light)', textAlign: 'center', cursor: 'pointer' }}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', color: 'var(--color-brand)', fontSize: '14px', fontWeight: 500, display: 'block', width: '100%' }}>
                    {files.length > 0 ? `${files.length} file(s) selected - click to change` : 'Click to upload sketches or reference photos'}
                  </label>
                </div>
                {files.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {files.map((f, i) => (
                      <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, backgroundColor: '#FAF7FC', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                        📎 {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone, Deadline, Expected Budget */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Phone / WhatsApp Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Required By (Deadline)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Expected Budget (Rs)</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Enter expected amount in Rs"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }}
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={submitting}
                style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-text)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1 }}
              >
                <Mail size={18} /> {submitting ? 'Submitting Inquiry…' : 'Submit Custom Request'}
              </motion.button>
            </form>
          )}
        </ScrollReveal>
      </div>
    </div>
  )
}

