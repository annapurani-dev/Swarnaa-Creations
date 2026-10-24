import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, FileText, Lock, Unlock, ArrowLeft, Heart } from 'lucide-react'
import { mockTutorials } from '../data/mockTutorials'
import { fetchTutorial } from '../api'
import { useAdminPreview } from '../context/AdminPreviewContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useLearning } from '../context/LearningContext'
import { useToast } from '../context/ToastContext'
import ScrollReveal from '../components/ScrollReveal'

export default function TutorialDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToLearning, isUnlocked } = useLearning()
  const { isStorePreview } = useAdminPreview()
  const toast = useToast()
  
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  const [activeTutorial, setActiveTutorial] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const fromApi = await fetchTutorial(id)
      if (fromApi) {
        setActiveTutorial(fromApi)
      } else {
        setActiveTutorial(mockTutorials.find((t) => t.id === parseInt(id, 10)) || null)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading tutorial…
      </div>
    )
  }

  if (!activeTutorial) {
    return (
      <div style={{ padding: '64px', textAlign: 'center' }}>
        <h2>Tutorial not found</h2>
        <button onClick={() => navigate('/tutorials')} style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}>Back to Tutorials</button>
      </div>
    )
  }

  const handlePurchase = () => {
    if (isStorePreview) {
      toast.info('Preview only — return to admin to manage the store.')
      return
    }
    if (isUnlocked(activeTutorial.id)) {
      toast.info('You already own this tutorial — open it from My Learning.')
      return
    }
    addToCart(activeTutorial, 1, 'digital', false, '', activeTutorial.price)
    toast.success('Added to cart')
    navigate('/cart')
  }

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header bar to go back and wishlist */}
      <ScrollReveal y={12}>
        <div style={{ padding: '24px 40px', backgroundColor: 'white', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/tutorials')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            <ArrowLeft size={20} /> Back to Learning Hub
          </button>
          <button 
            onClick={() => {
              if (isStorePreview) {
                toast.info('Preview only — return to admin to manage the store.')
                return
              }
              toggleWishlist(activeTutorial)
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: isInWishlist(activeTutorial.id) ? 'var(--color-brand)' : 'var(--color-text-secondary)', fontWeight: 600 }}
          >
            <Heart size={20} fill={isInWishlist(activeTutorial.id) ? "currentColor" : "none"} /> 
            {isInWishlist(activeTutorial.id) ? 'Saved to Wishlist' : 'Save to Wishlist'}
          </button>
        </div>
      </ScrollReveal>

      <div style={{ display: 'flex', flex: 1, flexDirection: activeTutorial.type === 'Video' ? 'row' : 'column', alignItems: activeTutorial.type === 'Video' ? 'stretch' : 'center', backgroundColor: '#FFF' }}>
        
        {activeTutorial.type === 'Video' ? (
          /* Left Side: Media Player (65%) */
          <ScrollReveal y={24} delay={0.05} style={{ flex: '0 0 65%', backgroundColor: '#111', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            <img src={activeTutorial.image} alt={activeTutorial.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          
          {activeTutorial.price > 0 && !isUnlocked(activeTutorial.id) ? (
            /* Locked State */
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '48px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Lock size={48} color="white" style={{ marginBottom: '16px' }} />
              <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '8px', fontFamily: 'Playfair Display' }}>Premium Tutorial</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>Purchase this tutorial to unlock the full step-by-step video and instructions.</p>
              <button 
                onClick={handlePurchase}
                style={{ backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', boxShadow: '0 8px 24px rgba(122, 107, 143,0.4)' }}
              >
                <Unlock size={18} /> Unlock for ₹{activeTutorial.price}
              </button>
            </div>
          ) : (
            /* Unlocked / Free State (Mock Player) */
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {activeTutorial.type === 'Video' ? (
                <>
                  <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--color-brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 12px 32px rgba(122, 107, 143,0.5)', marginBottom: '24px' }}>
                    <Play size={32} fill="currentColor" style={{ marginLeft: '6px' }} />
                  </div>
                  <p style={{ color: 'white', fontSize: '18px', fontWeight: 500 }}>Mock Video Player Active</p>
                  
                  {/* Mock Controls */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', marginBottom: '12px' }}>
                      <div style={{ width: '30%', height: '100%', backgroundColor: 'var(--color-brand)', borderRadius: '2px' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                      <span>12:45 / {activeTutorial.duration}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Text Only Image Display */
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <FileText size={48} style={{ marginBottom: '16px', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '24px', fontFamily: 'Playfair Display' }}>Written Guide</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>Follow the step-by-step instructions on the right.</p>
                  </div>
                )}
              </div>
            )}
          </ScrollReveal>
        ) : (
          /* Text-based Top Hero Image */
          <ScrollReveal y={24} style={{ width: '100%', height: '400px', flexShrink: 0, position: 'relative' }}>
            <img src={activeTutorial.image} alt={activeTutorial.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(255,255,255,1), transparent)' }}></div>
          </ScrollReveal>
        )}

        {/* Instructions Panel */}
        <ScrollReveal
          y={28}
          delay={0.1}
          style={{ 
            flex: activeTutorial.type === 'Video' ? '0 0 35%' : '1', 
            width: activeTutorial.type === 'Video' ? 'auto' : '100%',
            maxWidth: activeTutorial.type === 'Video' ? 'none' : '900px',
            padding: activeTutorial.type === 'Video' ? '40px' : '40px 40px 80px', 
            overflowY: 'auto', 
            backgroundColor: '#FFF' 
          }}
        >
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{ backgroundColor: 'var(--color-lavender-light)', color: 'var(--color-brand)', padding: '6px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
              {activeTutorial.category}
            </span>
            <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '6px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
              {activeTutorial.level}
            </span>
          </div>
          
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '32px', color: 'var(--color-text)', marginBottom: '16px', lineHeight: 1.2 }}>{activeTutorial.title}</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>{activeTutorial.description}</p>
          
          {activeTutorial.price === 0 && (
            <button 
              onClick={() => {
                if (!isUnlocked(activeTutorial.id)) {
                  addToLearning(activeTutorial.id)
                  toast.success('Added to My Learning successfully!')
                }
              }}
              style={{ backgroundColor: isUnlocked(activeTutorial.id) ? '#E8F5E9' : 'var(--color-brand)', color: isUnlocked(activeTutorial.id) ? '#2E7D32' : 'white', border: isUnlocked(activeTutorial.id) ? '1px solid #2E7D32' : 'none', padding: '12px 24px', borderRadius: '50px', fontSize: '14px', fontWeight: 600, cursor: isUnlocked(activeTutorial.id) ? 'default' : 'pointer', marginBottom: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: isUnlocked(activeTutorial.id) ? 'none' : '0 8px 24px rgba(122, 107, 143,0.3)' }}
            >
              {isUnlocked(activeTutorial.id) ? '✓ Saved to My Learning' : 'Add to My Learning'}
            </button>
          )}

          {activeTutorial.price > 0 && isUnlocked(activeTutorial.id) && (
            <div style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 12, background: '#E8F5E9', color: '#2E7D32', fontSize: 14, fontWeight: 600 }}>
              ✓ Unlocked — this tutorial is in your learning library
            </div>
          )}

          {/* Check if Locked */}
          {activeTutorial.price > 0 && !isUnlocked(activeTutorial.id) ? (
            <div style={{ backgroundColor: '#F8F9FA', padding: '24px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
              <Lock size={24} color="var(--color-text-secondary)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                The materials list and step-by-step instructions are hidden.<br/>Unlock the tutorial to view them.
              </p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>Required Materials</h3>
              <ul style={{ listStylePosition: 'inside', color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.8, marginBottom: '32px', padding: 0 }}>
                {(activeTutorial.materials || []).map((mat, i) => (
                  <li key={i}>{mat}</li>
                ))}
              </ul>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>Step-by-Step Instructions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(activeTutorial.steps || []).map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '28px', height: '28px', flexShrink: 0, backgroundColor: 'var(--color-lavender-light)', color: 'var(--color-brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <div style={{ color: 'var(--color-text)', fontSize: '15px', lineHeight: 1.6, paddingTop: '2px' }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ScrollReveal>
      </div>
    </div>
  )
}
