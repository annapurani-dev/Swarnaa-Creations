import React, { createContext, useContext, useEffect, useState } from 'react'
import { loginUser, signupUser } from '../api'

const AuthContext = createContext()
const SESSION_KEY = 'swarnaa_session'

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup' | 'forgot' | 'reset'
  const [pendingAction, setPendingAction] = useState(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
      if (saved?.id && saved?.email) {
        setUser(saved)
        setIsLoggedIn(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const persistSession = (nextUser) => {
    setUser(nextUser)
    setIsLoggedIn(true)
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setIsLoginModalOpen(false)
    setAuthMode('login')
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  const login = async (email, password) => {
    const { user: nextUser } = await loginUser(email, password)
    persistSession(nextUser)
    return nextUser
  }

  const signup = async ({ name, email, phone, password }) => {
    const { user: nextUser } = await signupUser({ name, email, phone, password })
    persistSession(nextUser)
    return nextUser
  }

  const logout = () => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const openLoginModal = (action = null) => {
    if (action && typeof action === 'function') {
      setPendingAction(() => action)
    }
    setAuthMode('login')
    setIsLoginModalOpen(true)
  }

  const openSignupModal = () => {
    setAuthMode('signup')
    setIsLoginModalOpen(true)
  }

  const closeLoginModal = () => {
    setPendingAction(null)
    setIsLoginModalOpen(false)
    setAuthMode('login')
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        signup,
        logout,
        isLoginModalOpen,
        authMode,
        setAuthMode,
        openLoginModal,
        openSignupModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
