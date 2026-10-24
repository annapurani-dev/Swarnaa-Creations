import React, { createContext, useContext, useState, useEffect } from 'react'

const WishlistContext = createContext()

export function useWishlist() {
  return useContext(WishlistContext)
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(() => {
    const saved = localStorage.getItem('swarnaa_wishlist')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('swarnaa_wishlist', JSON.stringify(wishlistItems))
  }, [wishlistItems])

  const toggleWishlist = (product) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === product.id)
      if (exists) {
        return prev.filter(item => item.id !== product.id)
      } else {
        return [...prev, product]
      }
    })
  }

  const removeFromWishlist = (productId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId))
  }

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId)
  }

  const getWishlistCount = () => {
    return wishlistItems.length
  }

  const value = {
    wishlistItems,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistCount
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}
