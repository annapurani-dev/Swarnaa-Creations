import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Box, PlaySquare, Mail, LogOut, Settings, Tag, Images, Lock, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPreview } from '../context/AdminPreviewContext'

export default function AdminLayout() {
  const { logout, user, isLoggedIn, login } = useAuth()
  const { exitStorePreview, enterStorePreview } = useAdminPreview()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@swarnaa.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isAdmin = isLoggedIn && user?.role === 'ADMIN'

  useEffect(() => {
    if (isAdmin) exitStorePreview()
  }, [isAdmin, exitStorePreview])

  const handleLogout = () => {
    exitStorePreview()
    logout()
    navigate('/')
  }

  const openWebsitePreview = () => {
    enterStorePreview()
    navigate('/')
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const nextUser = await login(email.trim().toLowerCase(), password)
      if (nextUser?.role !== 'ADMIN') {
        logout()
        setError('This account is not an admin.')
        return
      }
      exitStorePreview()
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(165deg, #F3EDF8, #FAF7FC)', padding: 24 }}>
        <form
          onSubmit={handleAdminLogin}
          style={{
            width: '100%',
            maxWidth: 400,
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 16px 40px rgba(90,70,120,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-lavender-light)', display: 'grid', placeItems: 'center', color: 'var(--color-brand)' }}>
              <Lock size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'Playfair Display', fontSize: 24 }}>Admin login</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Swarnaa Creations portal
              </p>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
            Email
          </label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            style={{ width: '100%', marginBottom: 14 }}
          />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
            Password
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ width: '100%', marginBottom: 16 }}
          />

          {error && (
            <p style={{ color: '#c94d5c', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to admin'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              marginTop: 14,
              width: '100%',
              border: 'none',
              background: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Back to store
          </button>
        </form>
      </div>
    )
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', end: true, icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingBag size={20} /> },
    { name: 'Categories', path: '/admin/categories', icon: <Tag size={20} /> },
    { name: 'Products', path: '/admin/products', icon: <Box size={20} /> },
    { name: 'Tutorials', path: '/admin/tutorials', icon: <PlaySquare size={20} /> },
    { name: 'Hero Images', path: '/admin/hero-images', icon: <Images size={20} /> },
    { name: 'Custom Requests', path: '/admin/requests', icon: <Mail size={20} /> },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      <div style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/brand-emblem.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
          <div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Admin Portal</h2>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Swarnaa Creations</span>
          </div>
        </div>

        <nav style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                textDecoration: 'none', fontSize: '15px', fontWeight: 500,
                color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-lavender-light)' : 'transparent',
                transition: 'all 0.2s'
              })}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '24px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={openWebsitePreview}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'var(--color-lavender-light)',
              color: 'var(--color-brand)',
              border: '1px solid rgba(122, 107, 143, 0.2)',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={18} /> View website
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{user?.email}</div>
            </div>
          </div>

          <button type="button" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'transparent', color: '#e74c3c', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: '72px', backgroundColor: 'white', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', flexShrink: 0 }}>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)', margin: 0 }}>
            Admin Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openWebsitePreview}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14 }}
            >
              <ExternalLink size={16} /> View website
            </button>
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} aria-label="Settings">
              <Settings size={22} />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
