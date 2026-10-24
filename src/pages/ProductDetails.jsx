import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Heart, Share2, Sparkles, ChevronLeft, Star, ShoppingBag, Zap, MessageCircle } from 'lucide-react'
import { mockProducts as dummyProducts } from '../data/mockProducts'
import { fetchProductById, fetchProducts, submitCustomRequest } from '../api'
import { useAdminPreview } from '../context/AdminPreviewContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import ScrollReveal from '../components/ScrollReveal'
import { whatsappUrl } from '../lib/whatsapp'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [productData, setProductData] = useState(() => {
    return dummyProducts.find(p => String(p.id) === String(id)) || null
  })
  const [loading, setLoading] = useState(!productData)
  
  const { isLoggedIn, user, openLoginModal } = useAuth()
  const { isStorePreview } = useAdminPreview()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const toast = useToast()

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const live = await fetchProductById(id)
        if (live && isMounted) {
          setProductData(live)
          setLoading(false)
          return
        }
      } catch (e) {
        console.error(e)
      }
      if (isMounted) {
        const fallback = dummyProducts.find(p => String(p.id) === String(id)) || null
        setProductData(fallback)
        setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [id])
  
  const guardPreview = () => {
    if (!isStorePreview) return false
    toast.info('Preview only — return to admin to manage the store.')
    return true
  }
  
  // State for pack size and customization
  const [packSize, setPackSize] = useState('standard')
  const [quantity, setQuantity] = useState(1)
  const [isCustomized, setIsCustomized] = useState(false)
  const [customText, setCustomText] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (loading) {
    return (
      <div style={{ padding: '120px 40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: '16px', fontWeight: 600 }}>Loading product details…</p>
      </div>
    )
  }

  if (!productData) {
    return (
      <div style={{ padding: '100px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: '26px', marginBottom: '12px' }}>Product not found.</h2>
        <Link to="/shop" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>Return to Shop</Link>
      </div>
    )
  }

  // Construct images gallery array
  const galleryImages = Array.isArray(productData.images) && productData.images.length > 0
    ? productData.images
    : [productData.image || '/crochet_tote.jpg']

  const product = {
    ...productData,
    images: galleryImages
  }

  // Calculate pricing
  const discountMultiplier = 1 - ((product.bulkDiscountPct ?? 20) / 100)
  let basePrice = product.price
  let currentPrice = packSize === 'bulk' ? Math.floor(basePrice * discountMultiplier) : basePrice

  const handleAddToCart = () => {
    if (guardPreview()) return
    if (!isLoggedIn) {
      openLoginModal(() => {
        addToCart(product, quantity, packSize, isCustomized, customText, currentPrice)
        toast.success('Successfully added to cart!')
      })
      return
    }

    addToCart(product, quantity, packSize, isCustomized, customText, currentPrice)
    toast.success('Successfully added to cart!')
  }

  const handleBuyNow = () => {
    if (guardPreview()) return
    const goCheckout = () => {
      // Buy Now checks out only this product — does not touch the cart
      navigate('/checkout', {
        state: {
          buyNowItem: {
            id: `buynow-${product.id}-${Date.now()}`,
            product,
            quantity,
            packSize,
            isCustomized,
            customText,
            price: currentPrice,
          },
        },
      })
    }

    if (!isLoggedIn) {
      openLoginModal(goCheckout)
      return
    }

    goCheckout()
  }

  const handleWishlist = () => {
    if (guardPreview()) return
    if (!isLoggedIn) {
      openLoginModal(() => toggleWishlist(product))
    } else {
      toggleWishlist(product)
    }
  }

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', paddingBottom: '40px' }}>
      <div className="container" style={{ paddingTop: '20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', maxWidth: '1000px', margin: '0 auto', paddingTop: '8px' }}>
          
          {/* Left Side: Product Image & Gallery */}
          <ScrollReveal y={28} delay={0.05} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            
            {/* Main Circular Image Wrapper */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px', aspectRatio: '1/1' }}>
              
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(122, 107, 143,0.15)', backgroundColor: 'var(--color-lavender-light)' }}>
                <img src={product.images[currentImageIndex]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={() => setCurrentImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                style={{ position: 'absolute', left: '-16px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', zIndex: 10 }}
              >
                <ChevronLeft size={20} color="var(--color-text)" />
              </button>
              <button 
                onClick={() => setCurrentImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                style={{ position: 'absolute', right: '-16px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', zIndex: 10 }}
              >
                <ChevronRight size={20} color="var(--color-text)" />
              </button>
            </div>

            {/* Thumbnails Gallery */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {product.images.map((img, idx) => (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCurrentImageIndex(idx)}
                  key={idx} 
                  style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: currentImageIndex === idx ? '2px solid var(--color-brand)' : '2px solid transparent', cursor: 'pointer', opacity: currentImageIndex === idx ? 1 : 0.6, transition: 'all 0.2s', backgroundColor: 'var(--color-lavender-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                >
                  <img src={img} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
                </motion.div>
              ))}
            </div>

          </ScrollReveal>

          {/* Right Side: Details & Ordering (Card) */}
          <ScrollReveal y={28} delay={0.12} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-white)', padding: '32px 32px 48px 32px', minHeight: '560px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-brand)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Swarnaa Creations
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {product.category.replace('-', ' ')}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={handleWishlist}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50px', border: '1px solid var(--color-border)', backgroundColor: isInWishlist(product.id) ? 'var(--color-lavender-light)' : 'white', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--color-brand)' }}
                >
                  <Heart size={16} fill={isInWishlist(product.id) ? "var(--color-brand)" : "none"} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => toast.success('Share link copied!')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', height: '32px', borderRadius: '50px', border: '1px solid var(--color-border)', backgroundColor: 'white', fontSize: '12px', fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>

            <h1 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '16px', lineHeight: 1.2 }}>
              {product.name}
            </h1>

            <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '16px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-brand)' }}>
                Rs {currentPrice} 
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '16px' }} />

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px', whiteSpace: 'pre-line' }}>
              {product.description ||
                'Handcrafted with meticulous attention to detail. This piece represents hours of dedicated craftsmanship, made specifically to bring warmth and elegance to your collection.'}
            </p>

            {/* Options: Quantity and Personalization */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              
              {/* Purchase Option Selector - iOS Toggle */}
              <div style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', backgroundColor: 'var(--color-lavender-light)', borderRadius: '50px', padding: '6px', position: 'relative' }}>
                  {[
                    { id: 'standard', label: 'Regular Order' },
                    { id: 'bulk', label: 'Bulk Order' }
                  ].map((option) => {
                    const isActive = packSize === option.id;
                    return (
                      <button 
                        key={option.id}
                        onClick={() => {
                          setPackSize(option.id)
                          setQuantity(option.id === 'bulk' ? 4 : 1)
                        }}
                        style={{
                          flex: 1, 
                          padding: '10px 0', 
                          borderRadius: '50px', 
                          fontSize: '13px', 
                          fontWeight: isActive ? 600 : 500, 
                          cursor: 'pointer', 
                          border: 'none',
                          backgroundColor: isActive ? 'white' : 'transparent',
                          color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isActive ? '0 4px 12px rgba(122, 107, 143,0.1)' : 'none',
                          position: 'relative',
                          zIndex: isActive ? 2 : 1
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center' }}>
                  Quantity
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '50px', overflow: 'hidden' }}>
                  <button 
                    onClick={() => {
                      if (quantity === 4 && packSize === 'bulk') {
                        setPackSize('standard');
                        setQuantity(3);
                      } else {
                        setQuantity(q => Math.max(1, q - 1));
                      }
                    }}
                    style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >-</button>
                  <div style={{ padding: '0 8px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', minWidth: '40px', textAlign: 'center' }}>
                    {quantity}
                  </div>
                  <button 
                    onClick={() => {
                      if (quantity === 3 && packSize === 'standard') {
                        setPackSize('bulk');
                        setQuantity(4);
                      } else {
                        setQuantity(q => q + 1);
                      }
                    }}
                    style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
              </div>

              {/* Personalization Toggle */}
              <div style={{ padding: '16px', border: isCustomized ? '2px solid var(--color-brand)' : '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: isCustomized ? 'rgba(122, 107, 143, 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%', margin: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                    Add Personalization
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isCustomized} 
                    onChange={(e) => setIsCustomized(e.target.checked)} 
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
                  />
                </label>
                
                <AnimatePresence>
                  {isCustomized && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <textarea 
                        value={customText} onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Tell us your sweet ideas — a special name, favorite colors, initials, or warm notes you'd love us to handcraft into this piece for you..."
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', marginTop: '16px', lineHeight: 1.5 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Target Date for Customization or Bulk Orders */}
              {(isCustomized || packSize === 'bulk') && (
                <div style={{ padding: '14px 16px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: '#FAF7FC' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                    Required By (Target Date / Event Date)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: 'white' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                    Helps our studio craft and dispatch your order in time.
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              {(isCustomized || packSize === 'bulk') ? (
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    const desc = isCustomized && customText.trim()
                      ? `Quote request for ${quantity}x ${product.name}. Personalization: "${customText.trim()}"`
                      : `Bulk quote request for ${quantity}x ${product.name}`

                    // Silently log to Admin Custom Requests database as well (price left null for Admin to quote)
                    try {
                      const data = new FormData()
                      data.append('customerName', user?.name || 'Storefront Customer')
                      data.append('customerEmail', user?.email || 'via-whatsapp@swarnaa.com')
                      data.append('customerPhone', user?.phone || '')
                      data.append('orderVolume', packSize === 'bulk' ? 'bulk' : 'single')
                      data.append('quantity', String(quantity || 1))
                      data.append('description', desc)
                      data.append('deadline', targetDate || '')
                      // No initial budget sent — Admin manually quotes price after confirmation
                      await submitCustomRequest(data)
                    } catch (err) {
                      console.error('Failed to log WhatsApp request to admin database:', err)
                    }

                    const customerGreeting = user?.name ? `Hello, this is ${user.name}.` : 'Hello Swarnaa Creations,'
                    let msg = `${customerGreeting}\n\nI would like to enquire about "${product.name}" (Quantity: ${quantity}).`
                    if (isCustomized && customText.trim()) {
                      msg += `\n\nPersonalisation details:\n"${customText.trim()}"`
                    }
                    if (targetDate) {
                      msg += `\n\nRequired By: ${targetDate}`
                    }
                    msg += `\n\nCould you please share the pricing and delivery details? Thank you!`
                    window.open(whatsappUrl(msg), '_blank')
                  }}
                  style={{ flex: 1, padding: '14px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '50px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <MessageCircle size={16} /> Request Quote via WhatsApp
                </motion.button>
              ) : (
                <>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    style={{ flex: 1, padding: '14px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <ShoppingBag size={16} /> Add to Cart
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleBuyNow}
                    style={{ flex: 1, padding: '14px', backgroundColor: 'var(--color-text)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Zap size={16} /> Buy Now
                  </motion.button>
                </>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
