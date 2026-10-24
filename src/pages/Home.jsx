import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import HeroOrbit from '../components/HeroOrbit'
import { fetchHeroImages, fetchProducts, fetchTutorials, fetchJournals } from '../api'
import { mockProducts } from '../data/mockProducts'
import { mockTutorials } from '../data/mockTutorials'
import { whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '../lib/whatsapp'

const FALLBACK_IMAGES = ['/crochet_tote.jpg', '/amigurumi_bear.jpg', '/hero-image.jpg']

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.15 + i * 0.14, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function Home() {
  const [heroImages, setHeroImages] = useState(FALLBACK_IMAGES)
  const [products, setProducts] = useState([])
  const [tutorials, setTutorials] = useState([])
  const [journals, setJournals] = useState([])
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.45, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.94])

  useEffect(() => {
    const load = async () => {
      const [heroRows, productRows, tutorialRows, journalRows] = await Promise.all([
        fetchHeroImages(),
        fetchProducts(),
        fetchTutorials(),
        fetchJournals(),
      ])

      const urls = heroRows
        .filter((r) => r.side === 'LEFT' || !r.side)
        .map((r) => r.imageUrl)
      if (urls.length) setHeroImages(urls)

      setProducts((productRows.length ? productRows : mockProducts).slice(0, 4))
      setTutorials((tutorialRows.length ? tutorialRows : mockTutorials).slice(0, 3))
      setJournals(journalRows.slice(0, 3))
    }
    load()
  }, [])

  return (
    <>
      <section className="hero-soon" ref={heroRef}>
        <motion.div
          className="hero-soon__stage"
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
        >
          <HeroOrbit images={heroImages} intervalMs={3600} />

          <div className="hero-soon__content">
            <motion.h1
              className="hero-soon__title"
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              Something special
              <br />
              is <span>on the way.</span>
            </motion.h1>

            <motion.p
              className="hero-soon__desc"
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              We’re creating handmade magic to make your moments more special
              and your gifts more meaningful.
            </motion.p>

            <motion.div
              className="hero-soon__actions"
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <Link to="/shop" className="btn-primary">
                Explore shop
              </Link>
              <a
                href={whatsappUrl(WHATSAPP_DEFAULT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Chat on WhatsApp
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Shop preview */}
      <section className="home-section">
        <div className="container">
          <ScrollReveal className="home-section__head" y={20}>
            <div>
              <h2>From the shop</h2>
              <p className="home-section__sub">A few handmade pieces ready to browse.</p>
            </div>
            <Link to="/shop" className="home-section__link">View all</Link>
          </ScrollReveal>

          <div className="home-product-grid">
            {products.map((product, i) => (
              <ScrollReveal key={product.id} delay={i * 0.04} y={18}>
                <Link to={`/shop/${product.id}`} className="home-product">
                  <motion.div whileHover={{ y: -4 }} className="home-product__inner">
                    <div className="home-product__media">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <p className="home-product__cat">
                      {(product.category || '').replace('-', ' ')}
                    </p>
                    <h3>{product.name}</h3>
                    <p className="home-product__price">₹{product.price}</p>
                  </motion.div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorials */}
      <section className="home-section home-section--soft">
        <div className="container">
          <ScrollReveal className="home-section__head" y={20}>
            <div>
              <h2>Learn with us</h2>
              <p className="home-section__sub">Step-by-step tutorials from the studio.</p>
            </div>
            <Link to="/tutorials" className="home-section__link">All tutorials</Link>
          </ScrollReveal>

          <div className="home-tutorial-grid">
            {tutorials.map((tut, i) => (
              <ScrollReveal key={tut.id} delay={i * 0.05} y={18}>
                <Link to={`/tutorial/${tut.id}`} className="home-tutorial">
                  <motion.div whileHover={{ y: -4 }} className="home-tutorial__inner">
                    <div className="home-tutorial__media">
                      <img src={tut.image} alt={tut.title} />
                      <span className="home-tutorial__play">
                        {tut.type === 'Video' ? <Play size={18} fill="currentColor" /> : <FileText size={18} />}
                      </span>
                    </div>
                    <p className="home-tutorial__meta">
                      {tut.category}
                      {tut.price === 0 ? ' · Free' : ` · ₹${tut.price}`}
                    </p>
                    <h3>{tut.title}</h3>
                  </motion.div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Custom orders */}
      <section className="home-section">
        <div className="container">
          <ScrollReveal className="home-band" y={20}>
            <div className="home-band__copy">
              <h2>Made for your moment</h2>
              <p>
                Need a one-of-a-kind gift or a bulk set for an event?
                Tell us what you imagine — we’ll craft it with you.
              </p>
            </div>
            <div className="home-band__actions">
              <Link to="/custom-orders" className="btn-primary">
                Request a custom order
                <ArrowRight size={16} />
              </Link>
              <a
                href={whatsappUrl('Hi! I’d like to discuss a custom order with Swarnaa Creations.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                WhatsApp us
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Journal */}
      <section className="home-section home-section--soft">
        <div className="container">
          <ScrollReveal className="home-section__head" y={20}>
            <div>
              <h2>Journal</h2>
              <p className="home-section__sub">Stories and notes from Swarnaa Creations.</p>
            </div>
            <Link to="/journal" className="home-section__link">Read more</Link>
          </ScrollReveal>

          <div className="home-journal-grid">
            {journals.map((post, i) => (
              <ScrollReveal key={post.id} delay={i * 0.05} y={16}>
                <Link to="/journal" className="home-journal">
                  <motion.article whileHover={{ y: -3 }}>
                    <h3>{post.title}</h3>
                    <p>{post.lead}</p>
                    <span>
                      Read journal <ArrowRight size={14} />
                    </span>
                  </motion.article>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="home-section home-section--close">
        <div className="container">
          <ScrollReveal className="home-close" y={20}>
            <h2>Find a piece that feels like you.</h2>
            <p>Browse the shop, or start a custom conversation.</p>
            <div className="home-close__actions">
              <Link to="/shop" className="btn-primary">Shop crafts</Link>
              <a
                href={whatsappUrl(WHATSAPP_DEFAULT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                WhatsApp us
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
