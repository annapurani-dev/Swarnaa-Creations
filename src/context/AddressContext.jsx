import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const AddressContext = createContext(null)

const storageKey = (userId) => `swarnaa_addresses_${userId || 'guest'}`

const readAddresses = (userId) => {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

const writeAddresses = (userId, addresses) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(addresses))
}

export function AddressProvider({ children }) {
  const { user, isLoggedIn } = useAuth()
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setAddresses([])
      return
    }
    setAddresses(readAddresses(user.id))
  }, [isLoggedIn, user?.id])

  const persist = useCallback((next) => {
    setAddresses(next)
    if (user?.id) writeAddresses(user.id, next)
  }, [user?.id])

  const addAddress = useCallback((address) => {
    const next = [
      ...addresses,
      {
        id: Date.now().toString(),
        label: (address.label || 'Home').trim(),
        address: (address.address || '').trim(),
        city: (address.city || '').trim(),
        state: (address.state || '').trim(),
        pincode: (address.pincode || '').trim(),
        isDefault: addresses.length === 0,
      },
    ]
    persist(next)
    return next[next.length - 1]
  }, [addresses, persist])

  const updateAddress = useCallback((id, patch) => {
    persist(addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }, [addresses, persist])

  const removeAddress = useCallback((id) => {
    const next = addresses.filter((a) => a.id !== id)
    if (next.length && !next.some((a) => a.isDefault)) {
      next[0] = { ...next[0], isDefault: true }
    }
    persist(next)
  }, [addresses, persist])

  const setDefaultAddress = useCallback((id) => {
    persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })))
  }, [addresses, persist])

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null

  return (
    <AddressContext.Provider
      value={{
        addresses,
        defaultAddress,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  )
}

export function useAddresses() {
  const ctx = useContext(AddressContext)
  if (!ctx) throw new Error('useAddresses must be used within AddressProvider')
  return ctx
}
