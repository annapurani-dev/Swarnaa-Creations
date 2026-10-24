import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLearning } from '../context/LearningContext'
import { useToast } from '../context/ToastContext'
import ScrollReveal from '../components/ScrollReveal'

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { isLoggedIn, openLoginModal } = useAuth()
  const { isUnlocked } = useLearning()
  const toast = useToast()
  const [activeFilter, setActiveFilter] = useState('Products')
  
  const filters = ['Products', 'Tutorials']

  const filteredItems = wishlistItems.filter(item => {
    const isTutorial = !!item.title;
    if (activeFilter === 'Products') return !isTutorial;
    if (activeFilter === 'Tutorials') return isTutorial;
    return true;
  })

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: '100px 40px', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Heart size={64} color="var(--color-border)" style={{ marginBottom: '24px' }} strokeWidth={1.5} />
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '32px', marginBottom: '16px', color: 'var(--color-text)' }}>Your Wishlist</h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
          Please sign in to view and manage your saved items.
        </p>
        <button onClick={() => openLoginModal()} style={{ padding: '16px 32px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}>
          Sign In
        </button>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container" style={{ padding: '100px 40px', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Heart size={64} color="var(--color-border)" style={{ marginBottom: '24px' }} strokeWidth={1.5} />
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '32px', marginBottom: '16px', color: 'var(--color-text)' }}>Your Wishlist is Empty</h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
          You haven't saved any items yet. Explore our curated catalogue to find pieces you love.
        </p>
        <Link to="/shop">
          <button style={{ padding: '16px 32px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}>
            Explore the Shop <ArrowRight size={18} />
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <ScrollReveal className="page-banner" y={16}>
        <div className="page-banner__inner">
          <div>
            <h1 className="page-banner__title">Your Wishlist</h1>
            <p className="page-banner__lead">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="container" style={{ marginTop: 32 }}>
        
        {/* iOS Toggle Style Filter */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', padding: '6px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{ 
                  position: 'relative', padding: '10px 24px', background: 'none', border: 'none', 
                  color: activeFilter === filter ? 'var(--color-brand)' : 'var(--color-text-secondary)', 
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s ease',
                  zIndex: 1
                }}
              >
                {activeFilter === filter && (
                  <motion.div 
                    layoutId="wishlistFilterIndicator"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', zIndex: -1 }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="product-grid">
          
          {filteredItems.map(product => {
            const isTutorial = !!product.title; // Tutorials use 'title', products use 'name'
            const itemUrl = isTutorial ? `/tutorial/${product.id}` : `/shop/${product.id}`;
            const itemTitle = product.name || product.title;
            const itemCategory = (product.category || '').replace('-', ' ');

            return (
              <Link to={itemUrl} key={product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <motion.div whileHover={{ y: -6 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} className="product-card">
                
                {/* Product Image Area - Circular */}
                <div style={{ position: 'relative', width: '160px', height: '160px', borderRadius: '50%', backgroundColor: 'var(--color-white)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)', marginBottom: '16px' }}>
                  {/* Floating Remove Button */}
                  <motion.button 
                    whileHover={{ scale: 1.1, backgroundColor: '#FFEAEA' }} whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.preventDefault()
                      removeFromWishlist(product.id)
                    }}
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10, color: 'var(--color-text-secondary)' }}
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </motion.button>
                  
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', borderRadius: '50%' }} />
                </div>

                {/* Product Details Area */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    {itemCategory}
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: 'var(--color-text)', marginBottom: '8px', lineHeight: 1.3 }}>
                    {itemTitle}
                  </h3>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-brand)', marginBottom: '12px' }}>
                    ₹{product.price}
                  </div>
                  {isTutorial && (product.price === 0 || isUnlocked(product.id)) ? (
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.preventDefault()
                        window.location.href = `/tutorial/${product.id}`
                      }}
                      style={{ padding: '6px 16px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
                    >
                      {isUnlocked(product.id) ? 'Open Tutorial' : 'Start Learning'}
                    </motion.button>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.preventDefault()
                        if (isTutorial && isUnlocked(product.id)) {
                          toast.info('You already own this tutorial.')
                          return
                        }
                        addToCart(product, 1, isTutorial ? 'digital' : 'standard', false, '', product.price)
                        toast.success('Successfully added to cart!')
                      }}
                      style={{ padding: '6px 16px', backgroundColor: 'var(--color-text)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
                    >
                      <ShoppingBag size={14} /> Move to Cart
                    </motion.button>
                  )}
                </div>

              </motion.div>
            </Link>
          )})}

        </div>

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>No items found in this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}
