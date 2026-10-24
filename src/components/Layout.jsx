import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Search, ShoppingBag, User, ChevronDown, BookOpen, Menu, X, Instagram, Facebook, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { fetchCategories, requestPasswordReset, resetPassword } from '../api'
import { useAdminPreview } from '../context/AdminPreviewContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { formatCategoryLabel } from '../lib/categories'
import Atmosphere from './Atmosphere'
import BrandMark from './BrandMark'
import ScrollReveal from './ScrollReveal'
import WhatsAppFab from './WhatsAppFab'

export default function Layout() {
  const [isShopHovered, setIsShopHovered] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false)
  const [shopCategories, setShopCategories] = useState([])
  const {
    isLoggedIn,
    user,
    login,
    signup,
    logout,
    isLoginModalOpen,
    authMode,
    setAuthMode,
    openLoginModal,
    closeLoginModal,
  } = useAuth()
  const { getCartItemCount } = useCart()
  const { getWishlistCount } = useWishlist()
  const { isStorePreview, exitStorePreview } = useAdminPreview()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const returnToAdmin = () => {
    exitStorePreview()
    navigate('/admin')
  }

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    code: '',
  })
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [issuedResetCode, setIssuedResetCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsMobileShopOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    let alive = true
    fetchCategories('PRODUCT')
      .then((cats) => { if (alive) setShopCategories(Array.isArray(cats) ? cats : []) })
      .catch(() => { if (alive) setShopCategories([]) })
    return () => { alive = false }
  }, [])

  // Never leave the account menu open across login / modal changes
  useEffect(() => {
    setIsUserMenuOpen(false)
  }, [isLoggedIn, isLoginModalOpen])

  useEffect(() => {
    if (!isUserMenuOpen) return undefined
    const onPointerDown = (e) => {
      if (!e.target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isUserMenuOpen])

  useEffect(() => {
    if (!isLoginModalOpen) return
    setAuthError('')
    setAuthForm({ name: '', email: '', phone: '', password: '', confirmPassword: '', code: '' })
    setIssuedResetCode('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [isLoginModalOpen])

  useEffect(() => {
    setAuthError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [authMode])

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthBusy(true)
    try {
      if (authMode === 'signup') {
        await signup(authForm)
      } else if (authMode === 'forgot') {
        const result = await requestPasswordReset(authForm.email)
        if (result.resetCode) {
          setIssuedResetCode(result.resetCode)
          setAuthForm((f) => ({ ...f, code: result.resetCode, password: '', confirmPassword: '' }))
          setAuthMode('reset')
          toast.success('Reset code ready — enter a new password.')
        } else {
          setAuthError('No account found for that email, or reset is unavailable. Try again or create an account.')
        }
      } else if (authMode === 'reset') {
        if (authForm.password !== authForm.confirmPassword) {
          throw new Error('Passwords do not match.')
        }
        await resetPassword({
          email: authForm.email,
          code: authForm.code,
          password: authForm.password,
        })
        toast.success('Password updated. Sign in with your new password.')
        setIssuedResetCode('')
        setAuthMode('login')
        setAuthForm({ name: '', email: authForm.email, phone: '', password: '', confirmPassword: '', code: '' })
      } else {
        const nextUser = await login(authForm.email, authForm.password)
        if (nextUser?.role === 'ADMIN') {
          exitStorePreview()
          toast.success('Welcome, admin.')
          navigate('/admin', { replace: true })
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Something went wrong.')
    } finally {
      setAuthBusy(false)
    }
  }

  const authTitle =
    authMode === 'signup'
      ? 'Create account'
      : authMode === 'forgot'
        ? 'Forgot password'
        : authMode === 'reset'
          ? 'Reset password'
          : 'Welcome back'

  const authSubtitle =
    authMode === 'signup'
      ? 'Join Swarnaa Creations to shop and track your orders.'
      : authMode === 'forgot'
        ? 'Enter the email on your account and we’ll issue a reset code.'
        : authMode === 'reset'
          ? 'Use the code below, then choose a new password.'
          : 'Sign in to your Swarnaa Creations account.'

  const authSubmitLabel =
    authBusy
      ? 'Please wait…'
      : authMode === 'signup'
        ? 'Create account'
        : authMode === 'forgot'
          ? 'Send reset code'
          : authMode === 'reset'
            ? 'Update password'
            : 'Sign In'

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileMenuOpen])

  // Preview is browse-only — keep admin out of checkout / account flows
  useEffect(() => {
    if (!isStorePreview) return
    const blocked = ['/cart', '/checkout', '/payment', '/profile', '/learning', '/wishlist', '/order-success']
    if (blocked.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))) {
      navigate('/', { replace: true })
    }
  }, [isStorePreview, location.pathname, navigate])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div className={`site-shell${isStorePreview ? ' site-shell--preview' : ''}`}>
      <Atmosphere />

      {isStorePreview && (
        <div className="admin-preview-bar" role="status">
          <span className="admin-preview-bar__label">Website preview — view only</span>
          <button type="button" className="admin-preview-bar__back" onClick={returnToAdmin}>
            <ArrowLeft size={16} strokeWidth={2} />
            Back to admin
          </button>
        </div>
      )}

      <header className="site-header">
        <div className="site-header__inner">
          <BrandMark />

          <nav className="site-nav" aria-label="Primary">
            <div
              className="site-nav__dropdown"
              onMouseEnter={() => setIsShopHovered(true)}
              onMouseLeave={() => setIsShopHovered(false)}
            >
              <Link to="/shop" className="site-nav__link">
                Craft Shop <ChevronDown size={14} />
              </Link>
              <AnimatePresence>
                {isShopHovered && (
                  <motion.div
                    className="site-nav__menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <Link to="/shop">All crafts</Link>
                    {shopCategories.map((cat) => (
                      <Link key={cat.id} to={`/shop?category=${encodeURIComponent(cat.name)}`}>
                        {formatCategoryLabel(cat.name)}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link to="/tutorials" className="site-nav__link">Tutorials</Link>
            <Link to="/journal" className="site-nav__link">Journal</Link>
          </nav>

          <div className="site-actions">
            <button
              type="button"
              className="site-actions__btn site-actions__menu-toggle"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
            </button>

            {!isStorePreview && (
              <>
                <button type="button" className="site-actions__btn" aria-label="Search">
                  <Search size={20} strokeWidth={2} />
                </button>

                {isLoggedIn ? (
                  <div style={{ position: 'relative' }} data-user-menu>
                    <button
                      type="button"
                      className="site-actions__btn"
                      aria-label="Account menu"
                      aria-expanded={isUserMenuOpen}
                      onClick={() => setIsUserMenuOpen((open) => !open)}
                    >
                      <User size={20} strokeWidth={2} />
                    </button>
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          className="site-actions__menu"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                        >
                          <Link to="/profile" onClick={() => setIsUserMenuOpen(false)}>
                            My Profile
                          </Link>
                          <Link to="/learning" onClick={() => setIsUserMenuOpen(false)}>
                            My Learning
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <Link
                              to="/admin"
                              onClick={() => {
                                setIsUserMenuOpen(false)
                                exitStorePreview()
                              }}
                            >
                              Admin portal
                            </Link>
                          )}
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              exitStorePreview()
                              logout()
                              navigate('/')
                            }}
                          >
                            Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="site-actions__btn"
                    aria-label="Log in"
                    onClick={openLoginModal}
                  >
                    <User size={20} strokeWidth={2} />
                  </button>
                )}

                {isLoggedIn && (
                  <>
                    <Link to="/learning" className="site-actions__btn" aria-label="My learning" style={{ display: 'grid' }}>
                      <BookOpen size={20} strokeWidth={2} />
                    </Link>
                    <Link to="/wishlist" className="site-actions__btn" aria-label="Wishlist" style={{ display: 'grid' }}>
                      <Heart size={20} strokeWidth={2} />
                      {getWishlistCount() > 0 && (
                        <span className="site-actions__badge">{getWishlistCount()}</span>
                      )}
                    </Link>
                    <Link to="/cart" className="site-actions__btn" aria-label="Cart" style={{ display: 'grid' }}>
                      <ShoppingBag size={20} strokeWidth={2} />
                      {getCartItemCount() > 0 && (
                        <span className="site-actions__badge">{getCartItemCount()}</span>
                      )}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              className="mobile-nav__backdrop"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />
            <motion.nav
              className="mobile-nav"
              aria-label="Mobile"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mobile-nav__group">
                <button
                  type="button"
                  className="mobile-nav__btn mobile-nav__toggle"
                  aria-expanded={isMobileShopOpen}
                  onClick={() => setIsMobileShopOpen((open) => !open)}
                >
                  Craft Shop
                  <ChevronDown
                    size={16}
                    className={isMobileShopOpen ? 'mobile-nav__chevron is-open' : 'mobile-nav__chevron'}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isMobileShopOpen && (
                    <motion.div
                      className="mobile-nav__dropdown"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link to="/shop" onClick={closeMobileMenu} className="mobile-nav__sub">All crafts</Link>
                      {shopCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/shop?category=${encodeURIComponent(cat.name)}`}
                          onClick={closeMobileMenu}
                          className="mobile-nav__sub"
                        >
                          {formatCategoryLabel(cat.name)}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link to="/tutorials" onClick={closeMobileMenu}>Tutorials</Link>
              <Link to="/journal" onClick={closeMobileMenu}>Journal</Link>
              <Link to="/custom-orders" onClick={closeMobileMenu}>Custom Orders</Link>
              {isStorePreview ? (
                <button
                  type="button"
                  className="mobile-nav__btn"
                  onClick={() => {
                    closeMobileMenu()
                    returnToAdmin()
                  }}
                >
                  Back to admin
                </button>
              ) : (
                isLoggedIn && (
                  <>
                    <Link to="/learning" onClick={closeMobileMenu}>My Learning</Link>
                    <Link to="/profile" onClick={closeMobileMenu}>My Account</Link>
                    <Link to="/wishlist" onClick={closeMobileMenu}>Wishlist</Link>
                    <Link to="/cart" onClick={closeMobileMenu}>Cart</Link>
                  </>
                )
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <ScrollReveal className="container site-footer__compact" y={16} amount={0.15}>
          <div className="site-footer__social" aria-label="Social links">
            <a href="#" aria-label="Instagram" title="Instagram">
              <Instagram size={18} strokeWidth={1.75} />
            </a>
            <a href="#" aria-label="Facebook" title="Facebook">
              <Facebook size={18} strokeWidth={1.75} />
            </a>
          </div>
          <BrandMark variant="footer" />
          <p className="site-footer__blurb">
            Crafting elegance and bringing warmth into everyday life through handmade art.
          </p>
          <p className="site-footer__copy">© 2026 Swarnaa Creations. All rights reserved.</p>
        </ScrollReveal>
      </footer>

      {!isStorePreview && <WhatsAppFab />}

      {isLoginModalOpen && !isStorePreview && (
        <div className="modal-backdrop" onClick={closeLoginModal}>
          <motion.div
            className="modal-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="modal-card__close" onClick={closeLoginModal} aria-label="Close">
              ×
            </button>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <BrandMark variant="stacked" to={null} />
            </div>
            <h2 style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>
              {authTitle}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: 28, fontSize: 14 }}>
              {authSubtitle}
            </p>
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {authMode === 'signup' && (
                <>
                  <input
                    className="input"
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    autoComplete="name"
                  />
                  <input
                    className="input"
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm((f) => ({ ...f, phone: e.target.value }))}
                    autoComplete="tel"
                  />
                </>
              )}
              <input
                className="input"
                type="email"
                name="email"
                placeholder="Email address"
                value={authForm.email}
                onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
                readOnly={authMode === 'reset'}
              />
              {authMode === 'reset' && (
                <>
                  {issuedResetCode && (
                    <p
                      style={{
                        margin: 0,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'rgba(124, 92, 150, 0.1)',
                        color: 'var(--color-text)',
                        fontSize: 13,
                        textAlign: 'center',
                      }}
                    >
                      Your reset code:{' '}
                      <strong style={{ letterSpacing: '0.12em', fontSize: 16 }}>{issuedResetCode}</strong>
                      <span style={{ display: 'block', marginTop: 4, color: 'var(--color-text-secondary)' }}>
                        Valid for 15 minutes
                      </span>
                    </p>
                  )}
                  <input
                    className="input"
                    type="text"
                    name="code"
                    placeholder="6-digit reset code"
                    value={authForm.code}
                    onChange={(e) => setAuthForm((f) => ({ ...f, code: e.target.value }))}
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </>
              )}
              {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
                <div className="input-password">
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder={authMode === 'reset' ? 'New password' : 'Password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="input-password__toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                  </button>
                </div>
              )}
              {authMode === 'reset' && (
                <div className="input-password">
                  <input
                    className="input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-password__toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                  </button>
                </div>
              )}
              {authMode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: -4 }}>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--color-brand)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      font: 'inherit',
                      fontSize: 13,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {authError && (
                <p style={{ color: '#c94d5c', fontSize: 13, margin: 0 }}>{authError}</p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 4 }}
                disabled={authBusy}
              >
                {authSubmitLabel}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              {authMode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-brand)', fontWeight: 600, cursor: 'pointer', font: 'inherit' }}
                  >
                    Sign in
                  </button>
                </>
              ) : authMode === 'forgot' || authMode === 'reset' ? (
                <>
                  Remembered it?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIssuedResetCode('')
                      setAuthMode('login')
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-brand)', fontWeight: 600, cursor: 'pointer', font: 'inherit' }}
                  >
                    Back to sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-brand)', fontWeight: 600, cursor: 'pointer', font: 'inherit' }}
                  >
                    Create one
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>
      )}
    </div>
  )
}
