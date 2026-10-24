import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, MapPin, LogOut, ChevronRight, X, CheckCircle, FileText, Printer, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAddresses } from '../context/AddressContext'
import { fetchOrders } from '../api'
import ScrollReveal from '../components/ScrollReveal'
import FullPageInvoiceModal from '../components/FullPageInvoiceModal'

const statusLabel = (status) => {
  const map = {
    PENDING_VERIFICATION: 'Pending verification',
    PAID: 'Paid',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
  }
  return map[status] || status || 'Processing'
}

const statusStyles = (status) => {
  if (status === 'DELIVERED' || status === 'PAID') {
    return { backgroundColor: '#E8F5E9', color: '#2E7D32' }
  }
  if (status === 'SHIPPED') {
    return { backgroundColor: '#E3F2FD', color: '#1565C0' }
  }
  return { backgroundColor: '#FFF3E0', color: '#E65100' }
}

export default function Profile() {
  const { isLoggedIn, user, logout } = useAuth()
  const toast = useToast()
  const { addresses, addAddress, removeAddress, setDefaultAddress } = useAddresses()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [activeTab, setActiveTab] = useState(
    location.state?.tab === 'addresses' ? 'addresses' : 'orders'
  )
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [nameInput, setNameInput] = useState(user?.name || '')
  const [emailInput, setEmailInput] = useState(user?.email || '')
  const [phoneInput, setPhoneInput] = useState(user?.phone || '')

  // Modals State
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/')
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (location.state?.tab === 'addresses' || location.state?.tab === 'orders') {
      setActiveTab(location.state.tab)
    }
  }, [location.state?.tab])

  useEffect(() => {
    if (!user?.email) return
    setOrdersLoading(true)
    fetchOrders(user.email)
      .then(setOrders)
      .finally(() => setOrdersLoading(false))
  }, [user?.email])

  if (!isLoggedIn || !user) return null

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSaveProfile = () => {
    setIsEditingProfile(false)
    toast.success('Profile updated successfully!')
  }

  const openAddressModal = () => {
    setAddressForm({ label: 'Home', address: '', city: '', state: '', pincode: '' })
    setIsAddressModalOpen(true)
  }

  const handleSaveAddress = () => {
    if (!addressForm.address.trim() || !addressForm.city.trim() || !addressForm.pincode.trim()) {
      toast.error('Please fill address, city, and PIN code.')
      return
    }
    addAddress(addressForm)
    setIsAddressModalOpen(false)
    toast.success('Address saved!')
  }

  return (
    <div className="page">
      <ScrollReveal className="page-banner" y={16}>
        <div className="page-banner__inner">
          <div>
            <h1 className="page-banner__title">My Account</h1>
            <p className="page-banner__lead">Orders and saved addresses for your account.</p>
          </div>
        </div>
      </ScrollReveal>

      <div className="container" style={{ position: 'relative', paddingTop: 36, display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Column: Sticky Personal Info Card */}
        <ScrollReveal y={24} delay={0.05} style={{ width: 300, flexShrink: 0, position: 'sticky', top: 100, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="surface" style={{ padding: 28, borderRadius: 'var(--radius-xl)' }}>
            
            {isEditingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Full Name</label>
                  <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Email</label>
                  <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Phone Number</label>
                  <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={handleSaveProfile} style={{ flex: 1, backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
                  <button onClick={() => setIsEditingProfile(false)} style={{ backgroundColor: '#f1f1f1', color: 'var(--color-text)', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h1 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>{nameInput}</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '24px' }}>{emailInput}</p>
                <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.05)', margin: '0 -32px 24px -32px' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone Number</label>
                    <div style={{ fontSize: '15px', color: 'var(--color-text)', marginTop: '4px' }}>{phoneInput}</div>
                  </div>
                  <button 
                    onClick={() => setIsEditingProfile(true)} 
                    style={{ color: 'var(--color-brand)', background: 'none', border: 'none', padding: 0, fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', marginTop: '8px' }}
                  >
                    Edit Profile
                  </button>
                </div>
              </>
            )}
            
          </div>

          <button 
            onClick={handleLogout}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '16px 24px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '12px', color: '#e74c3c', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
          >
            <LogOut size={18} /> Sign Out
          </button>
          
        </ScrollReveal>

        {/* Right Column: Main Content Area */}
        <ScrollReveal y={28} delay={0.1} style={{ flex: 1, minWidth: 0 }}>
          
          {/* iOS Style Segmented Control (Pill Shape) */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', padding: '6px', borderRadius: '50px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', width: 'fit-content' }}>
            {['orders', 'addresses'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  position: 'relative', padding: '12px 28px', background: 'none', border: 'none', 
                  color: activeTab === tab ? 'var(--color-brand)' : 'var(--color-text-secondary)', 
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s ease',
                  textTransform: 'capitalize', zIndex: 1
                }}
              >
                {activeTab === tab && (
                  <motion.div 
                    layoutId="pillSegmentIndicator"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', zIndex: -1 }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 2 }}>
                  {tab === 'orders' ? 'Order History' : 'Saved Addresses'}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            
            {/* Orders Tab Content */}
            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {ordersLoading && (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading your orders…</p>
                  )}
                  {!ordersLoading && orders.length === 0 && (
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                      No orders yet. Shop products or unlock a tutorial and they’ll show up here.
                    </p>
                  )}
                  {orders.map((order) => {
                    const pill = statusStyles(order.status)
                    const tutorialOnly = order.hasTutorial && !order.hasProduct
                    return (
                      <motion.div 
                        key={order.originalId || order.id}
                        whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.06)' }}
                        style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>{order.id}</span>
                            <span style={{ fontSize: '12px', padding: '4px 12px', backgroundColor: pill.backgroundColor, color: pill.color, borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {statusLabel(order.status)}
                            </span>
                            {order.hasTutorial && (
                              <span style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: 'var(--color-lavender-light)', color: 'var(--color-brand)', borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase' }}>
                                Tutorial
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                            Placed on <strong style={{ color: 'var(--color-text)' }}>{order.date}</strong>
                          </div>
                          <div style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.5 }}>{order.items}</div>
                        </div>
                        
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-brand)' }}>₹{order.total}</div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <motion.button
                              type="button"
                              onClick={() => setInvoiceModalOrder(order)}
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: 'var(--color-brand)', padding: '9px 16px', borderRadius: '50px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <FileText size={15} /> Invoice
                            </motion.button>
                            {tutorialOnly ? (
                              <motion.button 
                                type="button"
                                onClick={() => navigate(order.tutorialIds?.[0] ? `/tutorial/${order.tutorialIds[0]}` : '/learning')}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                style={{ background: 'var(--color-lavender-light)', border: 'none', color: 'var(--color-brand)', padding: '9px 18px', borderRadius: '50px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                Tutorial <ChevronRight size={15} />
                              </motion.button>
                            ) : (
                              <motion.button 
                                type="button"
                                onClick={() => setTrackingOrder(order)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                style={{ background: 'var(--color-lavender-light)', border: 'none', color: 'var(--color-brand)', padding: '9px 18px', borderRadius: '50px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                Track <ChevronRight size={15} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Addresses Tab Content */}
            {activeTab === 'addresses' && (
              <motion.div 
                key="addresses"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: 'var(--color-text)' }}>Your Saved Addresses</h2>
                  <motion.button 
                    onClick={openAddressModal}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(122, 107, 143,0.2)' }}
                  >
                    <MapPin size={14} /> Add New Address
                  </motion.button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
                  {addresses.length === 0 && (
                    <p style={{ color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>
                      No saved addresses yet. Add one to autofill checkout.
                    </p>
                  )}
                  {addresses.map((address) => (
                    <motion.div 
                      key={address.id}
                      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.06)' }}
                      style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '32px', border: address.isDefault ? '1.5px solid var(--color-brand)' : '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}
                    >
                      <div style={{ fontSize: '11px', padding: '6px 16px', backgroundColor: 'var(--color-lavender-light)', color: 'var(--color-brand)', borderRadius: '50px', fontWeight: 700, display: 'inline-block', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {address.label}{address.isDefault ? ' · Default' : ''}
                      </div>
                      <div style={{ fontSize: '16px', color: 'var(--color-text)', lineHeight: 1.8, marginBottom: '32px', fontWeight: 500 }}>
                        <span style={{ fontSize: '18px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>{user.name}</span>
                        {address.address}<br/>
                        {[address.city, address.state].filter(Boolean).join(', ')}<br/>
                        {address.pincode}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {!address.isDefault && (
                          <button
                            type="button"
                            onClick={() => { setDefaultAddress(address.id); toast.success('Default address updated') }}
                            style={{ flex: 1, minWidth: 120, padding: '12px', background: 'transparent', border: '1px solid var(--color-brand)', borderRadius: '12px', color: 'var(--color-brand)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Set default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { removeAddress(address.id); toast.info('Address removed') }}
                          style={{ flex: 1, minWidth: 120, padding: '12px', background: '#FFF5F5', border: '1px solid #FFEAEA', borderRadius: '12px', color: '#e74c3c', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </ScrollReveal>

      </div>

      {/* TRACKING MODAL */}
      <AnimatePresence>
        {trackingOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setTrackingOrder(null)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', width: '90%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)' }}>Track Order</h3>
                <button onClick={() => setTrackingOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Order ID</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-brand)' }}>{trackingOrder.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Current Status</div>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      ...statusStyles(trackingOrder.status)
                    }}
                  >
                    {statusLabel(trackingOrder.status)}
                  </span>
                </div>
              </div>

              {/* Dynamic Tracking Timeline */}
              {(() => {
                // Steps mapping directly to backend status progression
                const steps = [
                  {
                    key: 'ORDER_PLACED',
                    title: 'Order Placed & Payment Uploaded',
                    completed: true,
                    current: trackingOrder.status === 'PENDING_VERIFICATION',
                    time: trackingOrder.date || 'Recent'
                  },
                  {
                    key: 'PAID',
                    title: 'Payment Verified & In Crafting',
                    completed: ['PAID', 'SHIPPED', 'DELIVERED'].includes(trackingOrder.status),
                    current: trackingOrder.status === 'PAID',
                    time: ['PAID', 'SHIPPED', 'DELIVERED'].includes(trackingOrder.status) ? 'Confirmed' : 'Pending'
                  },
                  {
                    key: 'SHIPPED',
                    title: 'Dispatched & Handed to Courier',
                    completed: ['SHIPPED', 'DELIVERED'].includes(trackingOrder.status),
                    current: trackingOrder.status === 'SHIPPED',
                    time: ['SHIPPED', 'DELIVERED'].includes(trackingOrder.status) ? 'On the way' : 'Pending'
                  },
                  {
                    key: 'DELIVERED',
                    title: 'Delivered',
                    completed: trackingOrder.status === 'DELIVERED',
                    current: trackingOrder.status === 'DELIVERED',
                    time: trackingOrder.status === 'DELIVERED' ? 'Delivered' : 'Pending'
                  }
                ]

                return (
                  <div style={{ position: 'relative', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {/* Vertical connecting line */}
                    <div style={{ position: 'absolute', left: '9px', top: '10px', bottom: '16px', width: '2px', backgroundColor: '#E5E7EB', zIndex: 0 }} />

                    {steps.map((step, idx) => {
                      const isDone = step.completed
                      const isCurrent = step.current
                      const titleColor = isDone ? 'var(--color-text)' : '#9CA3AF'

                      return (
                        <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: isDone ? 'var(--color-brand)' : '#FFFFFF',
                              border: `3px solid ${isDone ? '#FFFFFF' : '#D1D5DB'}`,
                              boxShadow: isCurrent ? '0 0 0 3px rgba(226, 1, 113, 0.25)' : (isDone ? '0 0 0 1px var(--color-brand)' : 'none'),
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {isDone && (
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
                            )}
                          </div>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: isDone ? 700 : 500, color: titleColor }}>
                              {step.title}
                            </div>
                            <span style={{ fontSize: '12px', color: isDone ? 'var(--color-brand)' : '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {step.time}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOMER INVOICE & RECEIPT FULL PAGE MODAL */}
      {invoiceModalOrder && (
        <FullPageInvoiceModal
          order={invoiceModalOrder}
          onClose={() => setInvoiceModalOrder(null)}
        />
      )}

      {/* ADD ADDRESS MODAL */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddressModalOpen(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)' }}>Add New Address</h3>
                <button onClick={() => setIsAddressModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Label</label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none', backgroundColor: '#F8F9FA' }}
                  >
                    <option>Home</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Full Address</label>
                  <textarea
                    rows={3}
                    value={addressForm.address}
                    onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="123 Street Name, Apartment, Area"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none', backgroundColor: '#F8F9FA', resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="City"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none', backgroundColor: '#F8F9FA' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>State</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                      placeholder="State"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none', backgroundColor: '#F8F9FA' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Pincode</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm((f) => ({ ...f, pincode: e.target.value }))}
                    placeholder="Pincode"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none', backgroundColor: '#F8F9FA' }}
                  />
                </div>
              </div>

              <button 
                type="button"
                onClick={handleSaveAddress}
                style={{ width: '100%', marginTop: '32px', padding: '16px', backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(122, 107, 143,0.2)' }}
              >
                Save Address
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
