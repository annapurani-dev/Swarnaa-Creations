import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Play } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLearning } from '../context/LearningContext'
import { fetchTutorials } from '../api'
import ScrollReveal from '../components/ScrollReveal'

export default function MyLearning() {
  const { isLoggedIn, openLoginModal } = useAuth()
  const { isUnlocked } = useLearning()
  const navigate = useNavigate()
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTutorials()
      .then(setTutorials)
      .finally(() => setLoading(false))
  }, [])

  const unlockedTutorials = tutorials.filter((tut) => isUnlocked(tut.id))

  if (!isLoggedIn) {
    return (
      <div className="page">
        <ScrollReveal className="page-banner" y={16}>
          <div className="page-banner__inner">
            <div>
              <h1 className="page-banner__title">My Learning</h1>
              <p className="page-banner__lead">Sign in to see tutorials you’ve unlocked.</p>
            </div>
          </div>
        </ScrollReveal>
        <div className="container" style={{ padding: '48px 24px 80px', textAlign: 'center' }}>
          <BookOpen size={48} color="var(--color-border)" style={{ marginBottom: 20 }} />
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            Your learning library appears here after you sign in.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => openLoginModal()}>
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <ScrollReveal className="page-banner" y={16}>
        <div className="page-banner__inner">
          <div>
            <h1 className="page-banner__title">My Learning</h1>
            <p className="page-banner__lead">
              Tutorials you’ve unlocked — pick up where you left off.
            </p>
          </div>
          <Link to="/tutorials" className="home-section__link">
            Browse tutorials
          </Link>
        </div>
      </ScrollReveal>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>Loading your library…</p>
        ) : unlockedTutorials.length === 0 ? (
          <ScrollReveal y={18} style={{ textAlign: 'center', padding: '48px 16px' }}>
            <Play size={40} color="var(--color-header)" style={{ marginBottom: 16, opacity: 0.7 }} />
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 28, marginBottom: 10 }}>
              Nothing here yet
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, maxWidth: 360, marginInline: 'auto' }}>
              Unlock a paid tutorial or save a free one, and it will show up in your library.
            </p>
            <Link to="/tutorials" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Explore tutorials
            </Link>
          </ScrollReveal>
        ) : (
          <div className="learning-grid">
            {unlockedTutorials.map((tut, i) => (
              <ScrollReveal key={tut.id} y={20} delay={Math.min(i * 0.04, 0.2)}>
                <motion.article
                  className="learning-card"
                  whileHover={{ y: -4 }}
                >
                  <div className="learning-card__media">
                    {tut.image ? (
                      <img src={tut.image} alt="" />
                    ) : (
                      <div className="learning-card__placeholder" />
                    )}
                    {tut.type && (
                      <span className="learning-card__badge">{tut.type}</span>
                    )}
                  </div>
                  <div className="learning-card__body">
                    {tut.category && (
                      <p className="learning-card__cat">{tut.category}</p>
                    )}
                    <h3 className="learning-card__title">{tut.title}</h3>
                    {tut.level && (
                      <p className="learning-card__meta">{tut.level}{tut.duration ? ` · ${tut.duration}` : ''}</p>
                    )}
                    <button
                      type="button"
                      className="learning-card__cta"
                      onClick={() => navigate(`/tutorial/${tut.id}`)}
                    >
                      Resume learning
                    </button>
                  </div>
                </motion.article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
