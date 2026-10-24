import React, { useState, useEffect } from 'react'
import { Search, Eye, Filter, RefreshCw, X, ShoppingBag, MapPin, User, Mail, Phone, Calendar, CheckCircle2, Clock, Truck, AlertCircle, ExternalLink, Printer, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchOrders, updateOrderStatus } from '../../api'
import { useToast } from '../../context/ToastContext'
import FullPageInvoiceModal from '../../components/FullPageInvoiceModal'

const STATUS_OPTIONS = [
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'PAID', label: 'Paid / Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' }
]

const getStatusColor = (status) => {
  switch (status) {
    case 'DELIVERED':
      return { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' }
    case 'PAID':
      return { bg: '#EDE7F6', text: '#5E35B1', border: '#D1C4E9' }
    case 'SHIPPED':
      return { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB' }
    case 'PENDING_VERIFICATION':
    default:
      return { bg: '#FFF3E0', text: '#E65100', border: '#FFE0B2' }
  }
}

const getStatusLabel = (status) => {
  const match = STATUS_OPTIONS.find(opt => opt.value === status)
  return match ? match.label : (status || 'Pending Verification')
}

export default function OrdersAdmin() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isInvoiceView, setIsInvoiceView] = useState(false)

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchOrders()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching admin orders:', err)
      setError(err.message || 'Failed to fetch customer orders.')
      toast?.showToast?.('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleStatusChange = async (orderId, originalId, newStatus) => {
    const targetDbId = originalId || orderId
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(targetDbId, newStatus)
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
      toast?.showToast?.(`Order ${orderId} updated to ${getStatusLabel(newStatus)}`, 'success')
    } catch (err) {
      console.error('Failed to update status:', err)
      toast?.showToast?.(err.message || 'Failed to update order status', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'All' ? true : order.status === filter
    const term = searchTerm.toLowerCase().trim()
    if (!term) return matchesFilter

    const matchesSearch =
      (order.id && String(order.id).toLowerCase().includes(term)) ||
      (order.customer && order.customer.toLowerCase().includes(term)) ||
      (order.email && order.email.toLowerCase().includes(term)) ||
      (order.phone && order.phone.toLowerCase().includes(term)) ||
      (order.items && order.items.toLowerCase().includes(term))

    return matchesFilter && matchesSearch
  })

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>
            Order Management
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Real-time customer orders, payment verifications, and delivery statuses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={loadOrders}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'white',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            title="Refresh Orders"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              color="var(--color-text-secondary)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by ID, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                outline: 'none',
                minWidth: '240px',
                backgroundColor: 'white'
              }}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Statuses ({orders.length})</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="PAID">Paid / Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={28} className="spin" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--color-brand)' }} />
            <p style={{ fontSize: '15px', fontWeight: 500 }}>Fetching live orders from server...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#c94d5c' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>{error}</p>
            <button
              onClick={loadOrders}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-brand)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order ID</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, i) => {
                  const statusCol = getStatusColor(order.status)
                  const isUpdating = updatingId === order.id

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: i === filteredOrders.length - 1 ? 'none' : '1px solid var(--color-border)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                        {order.id}
                        {order.hasTutorial && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 8px', backgroundColor: 'var(--color-lavender-light)', color: 'var(--color-brand)', borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase' }}>
                            Tutorial
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                          {order.customer || 'Guest Customer'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {order.email || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                        {order.date}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text)', maxWidth: '280px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.items}>
                          {order.items || `${order.itemsCount || 1} item(s)`}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: 700, color: 'var(--color-brand)', whiteSpace: 'nowrap' }}>
                        Rs {Number(order.total || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <select
                          disabled={isUpdating}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, order.originalId, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '50px',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            border: `1px solid ${statusCol.border}`,
                            cursor: isUpdating ? 'wait' : 'pointer',
                            outline: 'none',
                            backgroundColor: statusCol.bg,
                            color: statusCol.text
                          }}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => { setSelectedOrder(order); setIsInvoiceView(true); }}
                            style={{
                              background: '#F5F3FF',
                              border: '1px solid #DDD6FE',
                              color: 'var(--color-brand)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '6px 12px',
                              borderRadius: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <FileText size={14} /> Invoice
                          </button>
                          <button
                            onClick={() => { setSelectedOrder(order); setIsInvoiceView(false); }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-brand)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px',
                              fontWeight: 600,
                              padding: '6px 10px',
                              borderRadius: '6px',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <Eye size={16} /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <ShoppingBag size={36} style={{ margin: '0 auto 12px', color: 'var(--color-border)' }} />
            <p style={{ fontSize: '15px', fontWeight: 500 }}>
              {searchTerm || filter !== 'All' ? 'No orders match your filter criteria.' : 'No customer orders have been placed yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                position: 'relative',
                padding: '32px'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <X size={22} />
              </button>

              {/* Standard Order Details View */}
              <div>
                  {/* Modal Header */}
                  <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)', margin: 0 }}>
                          Order {selectedOrder.id}
                        </h3>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '50px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: getStatusColor(selectedOrder.status).bg,
                            color: getStatusColor(selectedOrder.status).text,
                            border: `1px solid ${getStatusColor(selectedOrder.status).border}`
                          }}
                        >
                          {getStatusLabel(selectedOrder.status)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> Placed on {selectedOrder.date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInvoiceView(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: '#F5F3FF',
                        color: 'var(--color-brand)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <FileText size={15} /> View Invoice
                    </button>
                  </div>

                  {/* Customer Info & Shipping Address Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} /> Customer Information
                      </h4>
                      <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--color-text)', fontSize: '15px' }}>{selectedOrder.customer || '—'}</p>
                      <p style={{ margin: '0 0 6px', color: 'var(--color-text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} /> {selectedOrder.email || '—'}
                      </p>
                      {selectedOrder.phone && (
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} /> {selectedOrder.phone}
                        </p>
                      )}
                    </div>

                    <div style={{ backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} /> Shipping Destination
                      </h4>
                      {selectedOrder.shippingAddress || selectedOrder.shippingCity ? (
                        <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5 }}>
                          <div>{selectedOrder.shippingAddress}</div>
                          <div>
                            {[selectedOrder.shippingCity, selectedOrder.shippingState, selectedOrder.shippingPincode].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                          No physical shipping address provided (Digital / Workshop tutorial order).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items Ordered List */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
                      Ordered Items
                    </h4>
                    {selectedOrder.itemsList && selectedOrder.itemsList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedOrder.itemsList.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px',
                              border: '1px solid var(--color-border)',
                              borderRadius: '10px'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>{item.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                {item.type} · Qty: {item.quantity}
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-brand)' }}>
                              Rs {(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '14px', color: 'var(--color-text)' }}>
                        {selectedOrder.items}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '2px dashed var(--color-border)' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>Total Amount</span>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand)' }}>
                        Rs {Number(selectedOrder.total || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Screenshot (if verified via UPI upload) */}
                  {selectedOrder.paymentScreenshotUrl && (
                    <div style={{ marginBottom: '24px', backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        UPI Payment Receipt Screenshot
                      </h4>
                      <a href={selectedOrder.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-brand)', fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>
                        View full receipt image <ExternalLink size={14} />
                      </a>
                      <div style={{ maxHeight: '200px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <img
                          src={selectedOrder.paymentScreenshotUrl}
                          alt="Payment verification"
                          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Update Quick Bar */}
                  <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Update Status:</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          disabled={updatingId === selectedOrder.id}
                          onClick={() => handleStatusChange(selectedOrder.id, selectedOrder.originalId, opt.value)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: selectedOrder.status === opt.value ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                            backgroundColor: selectedOrder.status === opt.value ? 'var(--color-lavender-light)' : 'white',
                            color: selectedOrder.status === opt.value ? 'var(--color-brand)' : 'var(--color-text)'
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL PAGE A4 INVOICE & RECEIPT MODAL */}
      {isInvoiceView && selectedOrder && (
        <FullPageInvoiceModal
          order={selectedOrder}
          onClose={() => setIsInvoiceView(false)}
        />
      )}
    </div>
  )
}
