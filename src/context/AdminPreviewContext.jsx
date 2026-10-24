import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AdminPreviewContext = createContext(null)
const PREVIEW_KEY = 'swarnaa_admin_preview'

export function AdminPreviewProvider({ children }) {
  const [isStorePreview, setIsStorePreview] = useState(() => {
    try {
      return sessionStorage.getItem(PREVIEW_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      if (isStorePreview) sessionStorage.setItem(PREVIEW_KEY, '1')
      else sessionStorage.removeItem(PREVIEW_KEY)
    } catch {
      /* ignore */
    }
    document.body.classList.toggle('is-admin-preview', isStorePreview)
    return () => document.body.classList.remove('is-admin-preview')
  }, [isStorePreview])

  const enterStorePreview = useCallback(() => setIsStorePreview(true), [])
  const exitStorePreview = useCallback(() => setIsStorePreview(false), [])

  const value = useMemo(
    () => ({ isStorePreview, enterStorePreview, exitStorePreview }),
    [isStorePreview, enterStorePreview, exitStorePreview],
  )

  return (
    <AdminPreviewContext.Provider value={value}>
      {children}
    </AdminPreviewContext.Provider>
  )
}

export function useAdminPreview() {
  const ctx = useContext(AdminPreviewContext)
  if (!ctx) {
    throw new Error('useAdminPreview must be used within AdminPreviewProvider')
  }
  return ctx
}
