import React, { useMemo, useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Search, Filter, ShoppingBag, Sparkles, ChevronDown, ChevronRight, X, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { fetchProducts, fetchCategories } from '../api'
import { formatCategoryLabel } from '../lib/categories'
import ScrollReveal from '../components/ScrollReveal'

export default function CraftShop() {
  const { isLoggedIn, openLoginModal } = useAuth()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [openFilters, setOpenFilters] = useState({ categories: true, price: false })

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadData = async () => {
      const [data, cats] = await Promise.all([
        fetchProducts(),
        fetchCategories('PRODUCT').catch(() => []),
      ])
      setProducts(data)
      setCategories(Array.isArray(cats) ? cats : [])
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    if (!categoryParam) return products
    return products.filter((p) => p.category === categoryParam)
  }, [categoryParam, products])

  const pageTitle = categoryParam
    ? `${formatCategoryLabel(categoryParam)} Collection`
    : 'Curated Catalogue'

  const setCategoryFilter = (name) => {
    if (!name) {
      setSearchParams({})
    } else {
      setSearchParams({ category: name })
    }
  }

  const handleWishlistClick = (e, product) => {
    e.preventDefault() // Prevent navigation if wrapped in link
    if (!isLoggedIn) {
      openLoginModal(() => toggleWishlist(product))
    } else {
      toggleWishlist(product)
    }
  }

  const handleAddToCart = (e, product) => {
    e.preventDefault()
    if (!isLoggedIn) {
      openLoginModal(() => {
        addToCart(product, 1, 'standard', false, '', product.price)
        toast.success('Added to cart!')
      })
      return
    }
    addToCart(product, 1, 'standard', false, '', product.price)
    toast.success('Added to cart!')
  }

  return (
    <div className="page">
      <ScrollReveal className="page-banner" y={16}>
        <div className="page-banner__inner">
          <div>
            <h1 className="page-banner__title">{pageTitle}</h1>
            <p className="page-banner__lead">
              Handcrafted pieces made with love, patience, and the finest yarns.
            </p>
          </div>
          <Link to="/custom-orders">
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="btn btn-primary btn-pill btn-sm">
              Request custom order
            </motion.button>
          </Link>
        </div>
      </ScrollReveal>

      <div className="container">
        <div style={{ width: '100%' }}>
          <ScrollReveal className="page-toolbar" y={14} delay={0.05}>
            <span className="page-toolbar__meta">
              {loading ? 'Loading products...' : `Showing ${filteredProducts.length} products`}
            </span>

            <div className="page-toolbar__actions">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="btn btn-ghost-light btn-pill btn-sm"
              >
                <SlidersHorizontal size={15} /> Filters
              </button>
              <select className="select" style={{ width: 'auto', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
              </select>
            </div>
          </ScrollReveal>

          <div className="product-grid">
            {filteredProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={Math.min(index * 0.04, 0.24)} y={22}>
              <Link to={`/shop/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <motion.div whileHover={{ y: -6 }} className="product-card">
                
                <div className="product-card__media">
                  <motion.button 
                    className="product-card__wish"
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleWishlistClick(e, product)}
                    aria-label="Wishlist"
                  >
                    <Heart size={15} color="var(--color-brand)" fill={isInWishlist(product.id) ? "var(--color-brand)" : "none"} strokeWidth={1.5} />
                  </motion.button>
                  
                  <img src={product.image} alt={product.name} />
                </div>

                <div className="product-card__body">
                  <div className="product-card__cat">
                    {product.category.replace('-', ' ')}
                  </div>
                  <h3>{product.name}</h3>
                  <div className="product-card__price">
                    ₹{product.price}
                  </div>
                  <motion.button 
                    className="product-card__cart"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    <ShoppingBag size={14} /> Add to Cart
                  </motion.button>
                </div>

              </motion.div>
            </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>

      {/* Slide-out Filter Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsDrawerOpen(false)}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(2px)' }}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '360px', backgroundColor: 'white', zIndex: 1000, padding: '32px 24px', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text)', fontWeight: 600 }}>
                  <Filter size={20} />
                  <span style={{ fontSize: '20px' }}>Filters</span>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                  <X size={24} />
                </button>
              </div>

              {/* Categories */}
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                <div 
                  onClick={() => setOpenFilters(prev => ({ ...prev, categories: !prev.categories }))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <h3 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, color: 'var(--color-text)' }}>Categories</h3>
                  {openFilters.categories ? <ChevronDown size={18} color="var(--color-text-secondary)" /> : <ChevronRight size={18} color="var(--color-text-secondary)" />}
                </div>
                <AnimatePresence>
                  {openFilters.categories && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                          <input
                            type="radio"
                            name="shop-category"
                            checked={!categoryParam}
                            onChange={() => setCategoryFilter(null)}
                            style={{ accentColor: 'var(--color-brand)', width: '18px', height: '18px' }}
                          />
                          All Products
                        </label>
                        {categories.map((cat) => (
                          <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                            <input
                              type="radio"
                              name="shop-category"
                              checked={categoryParam === cat.name}
                              onChange={() => setCategoryFilter(cat.name)}
                              style={{ accentColor: 'var(--color-brand)', width: '18px', height: '18px' }}
                            />
                            {formatCategoryLabel(cat.name)}
                          </label>
                        ))}
                        {categories.length === 0 && (
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>No categories yet.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Range */}
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                <div 
                  onClick={() => setOpenFilters(prev => ({ ...prev, price: !prev.price }))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <h3 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, color: 'var(--color-text)' }}>Price</h3>
                  {openFilters.price ? <ChevronDown size={18} color="var(--color-text-secondary)" /> : <ChevronRight size={18} color="var(--color-text-secondary)" />}
                </div>
                <AnimatePresence>
                  {openFilters.price && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                        {['Under ₹1000', '₹1000 - ₹2000', '₹2000 - ₹3000', 'Over ₹3000'].map((price) => (
                          <label key={price} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--color-brand)', width: '18px', height: '18px' }} />
                            {price}
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                <button onClick={() => setIsDrawerOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Clear All
                </button>
                <button onClick={() => setIsDrawerOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Apply Filters
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
