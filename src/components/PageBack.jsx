import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function getFallbackPath(pathname) {
  if (pathname.startsWith('/shop/')) return '/shop'
  if (pathname.startsWith('/tutorial/')) return '/tutorials'
  if (pathname === '/payment') return '/checkout'
  if (pathname === '/checkout') return '/cart'
  if (pathname === '/cart') return '/shop'
  if (pathname === '/order-success') return '/'
  if (pathname.startsWith('/admin/') && pathname !== '/admin') return '/admin'
  return '/'
}

/** Site-wide back control. Hidden on home and admin root. */
export default function PageBack({ className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  if (path === '/' || path === '/admin') return null

  const fallback = getFallbackPath(path)

  const handleClick = () => {
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    navigate(fallback)
  }

  return (
    <button
      type="button"
      className={`page-back${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      aria-label="Go back"
    >
      <ArrowLeft size={16} strokeWidth={2} />
      Back
    </button>
  )
}
