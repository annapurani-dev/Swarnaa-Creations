import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fetchUnlockedTutorials } from '../api'
import { useAuth } from './AuthContext'

const LearningContext = createContext()

const storageKey = (userId) => `swarnaa_learning_${userId || 'guest'}`

const normalizeId = (id) => {
  const n = Number(id)
  return Number.isFinite(n) ? n : null
}

const readLocal = (userId) => {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]')
    return Array.isArray(raw)
      ? [...new Set(raw.map(normalizeId).filter((id) => id != null))]
      : []
  } catch {
    return []
  }
}

const writeLocal = (userId, ids) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(ids))
}

export function LearningProvider({ children }) {
  const { user, isLoggedIn } = useAuth()
  const [unlockedTutorialIds, setUnlockedTutorialIds] = useState([])

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setUnlockedTutorialIds([])
      return
    }

    setUnlockedTutorialIds(readLocal(user.id))

    let cancelled = false
    fetchUnlockedTutorials(user.email)
      .then((ids) => {
        if (cancelled || !Array.isArray(ids)) return
        const merged = [...new Set([
          ...readLocal(user.id),
          ...ids.map(normalizeId).filter((id) => id != null),
        ])]
        setUnlockedTutorialIds(merged)
        writeLocal(user.id, merged)
      })
      .catch(() => { /* keep local */ })

    return () => { cancelled = true }
  }, [isLoggedIn, user?.id, user?.email])

  const persist = useCallback((ids) => {
    setUnlockedTutorialIds(ids)
    if (user?.id) writeLocal(user.id, ids)
  }, [user?.id])

  const addToLearning = useCallback((tutorialId) => {
    const id = normalizeId(tutorialId)
    if (id == null) return
    setUnlockedTutorialIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      if (user?.id) writeLocal(user.id, next)
      return next
    })
  }, [user?.id])

  const unlockTutorials = useCallback((tutorialIds = []) => {
    const incoming = tutorialIds.map(normalizeId).filter((id) => id != null)
    if (!incoming.length) return
    setUnlockedTutorialIds((prev) => {
      const next = [...new Set([...prev, ...incoming])]
      if (user?.id) writeLocal(user.id, next)
      return next
    })
  }, [user?.id])

  const isUnlocked = useCallback((tutorialId) => {
    const id = normalizeId(tutorialId)
    return id != null && unlockedTutorialIds.includes(id)
  }, [unlockedTutorialIds])

  return (
    <LearningContext.Provider
      value={{
        unlockedTutorialIds,
        addToLearning,
        unlockTutorials,
        isUnlocked,
        persist,
      }}
    >
      {children}
    </LearningContext.Provider>
  )
}

export function useLearning() {
  return useContext(LearningContext)
}
