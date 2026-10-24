import { useEffect, useState } from 'react'
import ScrollReveal from '../components/ScrollReveal'
import { fetchJournals } from '../api'

const formatDate = (value) => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function Journal() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await fetchJournals()
      setPosts(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="page">
      <ScrollReveal className="page-banner" y={16}>
        <div className="page-banner__inner">
          <div>
            <h1 className="page-banner__title">Journal</h1>
            <p className="page-banner__lead">
              Stories, studio notes, and inspiration from Swarnaa Creations.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 72 }}>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>Loading stories…</p>
        ) : posts.length === 0 ? (
          <ScrollReveal className="surface" y={22} style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.7 }}>
              Journal posts are coming soon — check back for craft tips and behind-the-scenes stories.
            </p>
          </ScrollReveal>
        ) : (
          <div className="journal-grid">
            {posts.map((post, i) => (
              <ScrollReveal key={post.id} delay={Math.min(i * 0.05, 0.25)} y={22}>
                <article className="journal-card">
                  {post.image && (
                    <div className="journal-card__media">
                      <img src={post.image} alt="" />
                    </div>
                  )}
                  <div className="journal-card__body">
                    <time>{formatDate(post.publishedAt)}</time>
                    <h2>{post.title}</h2>
                    <p>{post.lead || post.body}</p>
                    {post.body && post.lead && (
                      <p className="journal-card__more">{post.body}</p>
                    )}
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
