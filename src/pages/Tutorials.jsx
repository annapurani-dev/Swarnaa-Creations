import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, FileText, Lock, Unlock, Clock, Star, ArrowRight, Heart } from 'lucide-react'
import { fetchTutorials, fetchCategories } from '../api'
import { useWishlist } from '../context/WishlistContext'
import { useLearning } from '../context/LearningContext'
import { formatCategoryLabel } from '../lib/categories'
import ScrollReveal from '../components/ScrollReveal'

export default function Tutorials() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { isUnlocked } = useLearning()

  const [tutorials, setTutorials] = useState([])
  const [categoryNames, setCategoryNames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTutorials()
  }, [])

  const loadTutorials = async () => {
    const [data, cats] = await Promise.all([
      fetchTutorials(),
      fetchCategories('TUTORIAL').catch(() => []),
    ])
    setTutorials(data)
    const fromApi = (Array.isArray(cats) ? cats : []).map((c) => c.name)
    const fromItems = [...new Set(data.map((t) => t.category).filter(Boolean))]
    setCategoryNames([...new Set([...fromApi, ...fromItems])])
    setLoading(false)
  }

  const categories = ['All', ...categoryNames]

  const filteredTutorials = useMemo(() => {
    return tutorials.filter((tut) => {
      const matchesCategory =
        activeCategory === 'All' ||
        tut.category === activeCategory ||
        formatCategoryLabel(tut.category) === formatCategoryLabel(activeCategory)
      const matchesSearch = tut.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery, tutorials])

  return (
    <div className="page">
      <ScrollReveal className="page-banner" y={16}>
        <div className="page-banner__inner">
          <div>
            <h1 className="page-banner__title">Learning Hub</h1>
            <p className="page-banner__lead">
              Master handmade crafting with paced lessons from our studio.
            </p>
          </div>
          <div className="search-field">
            <Search size={17} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </ScrollReveal>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
        <ScrollReveal style={{ marginBottom: 40 }} y={14}>
          <div className="chip-row">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`chip${activeCategory === category ? ' is-active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {activeCategory === category && (
                  <motion.div
                    layoutId="categoryIndicator"
                    style={{
                      position: 'absolute', inset: 0, background: '#fff',
                      borderRadius: 999, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: -1,
                    }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {category === 'All' ? 'All' : formatCategoryLabel(category)}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading tutorials…</p>
        )}

        <div className="tutorial-grid">
          <AnimatePresence>
            {filteredTutorials.map((tut, index) => (
              <motion.div
                key={tut.id}
                className="tutorial-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
                onClick={() => window.open(`/tutorial/${tut.id}`, '_blank')}
              >
                <div className="tutorial-card__media">
                  <img src={tut.image} alt={tut.title} />
                  <div className="tutorial-card__badge">{formatCategoryLabel(tut.category)}</div>
                  <div className="tutorial-card__play">
                    {tut.type === 'Video' ? <Play size={22} fill="currentColor" style={{ marginLeft: '3px' }} /> : <FileText size={22} />}
                  </div>
                  <div className={`tutorial-card__price ${tut.price === 0 ? 'is-free' : ''}`}>
                    {tut.price === 0 ? 'FREE' : `₹${tut.price}`}
                  </div>
                </div>

                <div className="tutorial-card__body">
                  <div className="tutorial-card__meta">
                    <button
                      type="button"
                      className="tutorial-card__wish"
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(tut); }}
                      aria-label="Wishlist"
                    >
                      <Heart size={14} fill={isInWishlist(tut.id) ? 'currentColor' : 'none'} />
                    </button>
                    <span><Star size={13} color="#F59E0B" fill="#F59E0B" /> {tut.level}</span>
                    <span><Clock size={13} /> {tut.duration}</span>
                  </div>
                  <h3>{tut.title}</h3>
                  <p>{tut.description}</p>

                  <div className="tutorial-card__cta">
                    {tut.price > 0 && !isUnlocked(tut.id) ? (
                      <>Unlock <Lock size={14} /></>
                    ) : (
                      <>Start <ArrowRight size={14} /></>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && filteredTutorials.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>No tutorials found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
