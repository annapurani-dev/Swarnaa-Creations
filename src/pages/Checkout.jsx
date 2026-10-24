import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { CreditCard, MapPin } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useAddresses } from '../context/AddressContext'
import ScrollReveal from '../components/ScrollReveal'

export default function Checkout() {
  const { cartItems } = useCart()
  const { isLoggedIn, user } = useAuth()
  const { addresses, defaultAddress } = useAddresses()
  const navigate = useNavigate()
  const location = useLocation()

  const buyNowItem = location.state?.buyNowItem || null
  const isBuyNow = Boolean(buyNowItem)

  const checkoutItems = useMemo(
    () => (isBuyNow ? [buyNowItem] : cartItems),
    [isBuyNow, buyNowItem, cartItems]
  )

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })
  const [selectedAddressId, setSelectedAddressId] = useState(null)

  const applyAddress = (addr) => {
    if (!addr) return
    setSelectedAddressId(addr.id)
    setFormData((prev) => ({
      ...prev,
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    }))
  }

  // Prefill name/phone from account
  useEffect(() => {
    if (!user) return
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      phone: prev.phone || user.phone || '',
    }))
  }, [user])

  // Auto-fill shipping from default/first saved address
  useEffect(() => {
    if (!defaultAddress) return
    setFormData((prev) => {
      // Only auto-fill if shipping fields are still empty
      if (prev.address || prev.city || prev.pincode) return prev
      return {
        ...prev,
        address: defaultAddress.address || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        pincode: defaultAddress.pincode || '',
      }
    })
    setSelectedAddressId((id) => id || defaultAddress.id)
  }, [defaultAddress])

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/')
      return
    }
    if (!isBuyNow && cartItems.length === 0) {
      navigate('/cart')
    }
  }, [isLoggedIn, isBuyNow, cartItems.length, navigate])

  if (!isLoggedIn || checkoutItems.length === 0) {
    return null
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Typing manually clears the “selected saved address” highlight if fields diverge
    if (['address', 'city', 'state', 'pincode'].includes(name)) {
      setSelectedAddressId(null)
    }
  }

  const handleProceedToPayment = (e) => {
    e.preventDefault()
    navigate('/payment', {
      state: {
        formData,
        checkoutItems,
        isBuyNow,
      },
    })
  }

  const totalAmount = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const hasPhysicalItems = checkoutItems.some((item) => item.packSize !== 'digital')

  return (
    <div className="container" style={{ padding: '60px 40px 100px 40px', minHeight: '80vh', maxWidth: '1000px' }}>
      <ScrollReveal y={18} delay={0.04}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '42px', marginBottom: '12px', color: 'var(--color-text)' }}>Secure Checkout</h1>
        {isBuyNow && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 28 }}>
            Buying this item only — your cart is unchanged.
          </p>
        )}
        {!isBuyNow && <div style={{ marginBottom: 28 }} />}
      </ScrollReveal>
      
      <form onSubmit={handleProceedToPayment} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
        
        <ScrollReveal y={28} delay={0.08} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', marginBottom: '24px', color: 'var(--color-text)' }}>{hasPhysicalItems ? 'Shipping Details' : 'Billing Details'}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none' }} placeholder="Jane Doe" />
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Phone Number</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none' }} placeholder="+91 98765 43210" />
              </div>
              
              {hasPhysicalItems && (
                <>
                  {addresses.length > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                          Saved addresses
                        </label>
                        <Link
                          to="/profile"
                          state={{ tab: 'addresses' }}
                          style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand)', textDecoration: 'none' }}
                        >
                          Manage
                        </Link>
                      </div>
                      <div className="checkout-address-grid">
                        {addresses.map((addr) => {
                          const selected = selectedAddressId === addr.id
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              className={`checkout-address-card${selected ? ' is-selected' : ''}`}
                              onClick={() => applyAddress(addr)}
                            >
                              <span className="checkout-address-card__label">
                                <MapPin size={13} />
                                {addr.label || 'Address'}
                                {addr.isDefault ? ' · Default' : ''}
                              </span>
                              <span className="checkout-address-card__text">
                                {addr.address}
                                {(addr.city || addr.state || addr.pincode) && (
                                  <>
                                    <br />
                                    {[addr.city, addr.state].filter(Boolean).join(', ')}
                                    {addr.pincode ? ` · ${addr.pincode}` : ''}
                                  </>
                                )}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {addresses.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', marginBottom: 4 }}>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        No saved addresses yet.{' '}
                        <Link to="/profile" state={{ tab: 'addresses' }} style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                          Add one in My Account
                        </Link>
                      </p>
                    </div>
                  )}

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Delivery Address</label>
                    <textarea required name="address" value={formData.address} onChange={handleInputChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none', minHeight: '80px', resize: 'vertical' }} placeholder="123 Craft Street, Apartment 4B" />
                  </div>
    
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>City</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleInputChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none' }} />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>State</label>
                    <input required type="text" name="state" value={formData.state} onChange={handleInputChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none' }} />
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>PIN Code</label>
                    <input required type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none' }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal y={28} delay={0.14} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', marginBottom: '24px', color: 'var(--color-text)' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {checkoutItems.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '16px' }}>
                  <img src={item.product.image} alt={item.product.name || item.product.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{item.product.name || item.product.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      Qty: {item.quantity} | {item.packSize === 'bulk' ? 'Bulk Order' : item.packSize === 'digital' ? 'Tutorial' : 'Regular Order'}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '24px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Subtotal</span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>₹{totalAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <span style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Shipping</span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-brand)' }}>{hasPhysicalItems ? 'Calculated Later' : 'Not Applicable'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)' }}>Total</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-brand)' }}>₹{totalAmount}</span>
            </div>

            <button 
              type="submit"
              style={{ width: '100%', padding: '18px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}
            >
              <CreditCard size={18} /> Proceed to Payment
            </button>
          </div>

        </ScrollReveal>

      </form>
    </div>
  )
}
