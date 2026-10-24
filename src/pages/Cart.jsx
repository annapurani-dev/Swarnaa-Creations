import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLearning } from '../context/LearningContext'
import { useToast } from '../context/ToastContext'
import ScrollReveal from '../components/ScrollReveal'

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, getCartItemCount } = useCart()
  const { isLoggedIn, openLoginModal } = useAuth()
  const { isUnlocked } = useLearning()
  const toast = useToast()
  const navigate = useNavigate()

  // Drop already-owned tutorials so users can't pay again
  useEffect(() => {
    if (!isLoggedIn) return
    const ownedDigital = cartItems.filter(
      (item) => item.packSize === 'digital' && isUnlocked(item.product?.id)
    )
    if (!ownedDigital.length) return
    ownedDigital.forEach((item) => removeFromCart(item.id))
    toast.info('Removed tutorials you already own. Open them from My Learning.')
  }, [isLoggedIn, cartItems, isUnlocked, removeFromCart, toast])

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: '120px 40px', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ScrollReveal y={24} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <ShoppingBag size={64} color="var(--color-border)" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '32px', marginBottom: '16px', color: 'var(--color-text)' }}>Your Cart</h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Please log in to view your shopping cart.</p>
          <button 
            onClick={openLoginModal}
            style={{ padding: '16px 32px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}
          >
            Sign In
          </button>
        </ScrollReveal>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '120px 40px', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ScrollReveal y={24} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <ShoppingBag size={64} color="var(--color-lavender)" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '32px', marginBottom: '16px', color: 'var(--color-text)' }}>Your cart is feeling light</h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Looks like you haven't added any beautiful crafts yet.</p>
          <Link to="/shop">
            <button 
              style={{ padding: '16px 32px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}
            >
              Explore the Shop
            </button>
          </Link>
        </ScrollReveal>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '60px 40px 100px 40px', minHeight: '80vh' }}>
      <ScrollReveal y={18}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '42px', marginBottom: '40px', color: 'var(--color-text)' }}>Your Cart</h1>
      </ScrollReveal>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '60px' }}>
        
        {/* Left Pane: Items List */}
        <ScrollReveal y={28} delay={0.05}>
          <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            <span>Product</span>
            <span>Quantity</span>
          </div>

          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, paddingBottom: 0 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.03)', marginBottom: '24px', overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                    <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: 'var(--color-cream)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>{item.product.name || item.product.title}</h3>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      {item.packSize === 'bulk' ? 'Bulk Order' : item.packSize === 'digital' ? 'Digital Tutorial' : 'Regular Order'}
                    </div>
                    {item.isCustomized && (
                      <div style={{ fontSize: '13px', color: 'var(--color-brand)', marginTop: '4px', backgroundColor: 'rgba(122, 107, 143,0.05)', padding: '6px 12px', borderRadius: '50px', display: 'inline-block' }}>
                        <strong>Custom:</strong> {item.customText || 'None provided'}
                      </div>
                    )}
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-brand)', marginTop: '8px' }}>
                      ₹{item.price}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '50px', overflow: 'hidden', backgroundColor: 'white' }}>
                    <button 
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      style={{ padding: '8px 14px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', fontSize: '16px', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'var(--color-cream)'} onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >-</button>
                    <div style={{ padding: '0 8px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', minWidth: '32px', textAlign: 'center' }}>
                      {item.quantity}
                    </div>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{ padding: '8px 14px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', fontSize: '16px', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'var(--color-cream)'} onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >+</button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', padding: '6px 12px', borderRadius: '50px' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.backgroundColor = '#FFEAEA'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollReveal>

        {/* Right Pane: Order Summary */}
        <ScrollReveal y={28} delay={0.12}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)', position: 'sticky', top: '120px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', marginBottom: '24px', color: 'var(--color-text)' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              <span>Subtotal ({getCartItemCount()} items)</span>
              <span>₹{getCartTotal()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            
            <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '24px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontSize: '18px', fontWeight: 600, color: 'var(--color-text)' }}>
              <span>Estimated Total</span>
              <span style={{ color: 'var(--color-brand)' }}>₹{getCartTotal()}</span>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')}
              style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
          </div>
        </ScrollReveal>

      </div>
    </div>
  )
}
