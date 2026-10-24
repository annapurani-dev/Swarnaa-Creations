import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  ShoppingBag,
  IndianRupee,
  RefreshCw,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Truck,
  Package,
  Layers,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchOrders, fetchTutorials, fetchProducts } from '../../api'

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersRes, prodsRes, tutsRes] = await Promise.allSettled([
        fetchOrders(),
        fetchProducts(),
        fetchTutorials()
      ])
      if (ordersRes.status === 'fulfilled') setOrders(Array.isArray(ordersRes.value) ? ordersRes.value : [])
      if (prodsRes.status === 'fulfilled') setProducts(Array.isArray(prodsRes.value) ? prodsRes.value : [])
      if (tutsRes.status === 'fulfilled') setTutorials(Array.isArray(tutsRes.value) ? tutsRes.value : [])
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Metric Computations
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  // Status breakdowns
  const pendingOrders = orders.filter((o) => o.status === 'PENDING_VERIFICATION')
  const paidOrders = orders.filter((o) => o.status === 'PAID')
  const shippedOrders = orders.filter((o) => o.status === 'SHIPPED')
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED')
  const activeOrdersCount = pendingOrders.length + paidOrders.length + shippedOrders.length

  // Customer details
  const uniqueCustomerEmails = new Set(orders.map((o) => o.email).filter(Boolean))
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0

  // Catalog breakdown
  const freeTutorials = tutorials.filter((t) => t.isFree || t.price === 0).length
  const paidTutorials = tutorials.length - freeTutorials

  const statCards = [
    {
      title: 'Total Revenue',
      value: `Rs ${totalRevenue.toLocaleString()}`,
      badge: `${orders.length} total orders`,
      badgeType: 'neutral',
      icon: <IndianRupee size={22} />,
      accentBg: '#FFF0F5',
      accentColor: 'var(--color-brand)',
      details: [
        { label: 'Avg Order Value', value: `Rs ${avgOrderValue.toLocaleString()}` },
        { label: 'Delivered / Completed', value: `Rs ${deliveredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0).toLocaleString()}` }
      ]
    },
    {
      title: 'Active Orders',
      value: activeOrdersCount.toString(),
      badge: `${pendingOrders.length} pending verify`,
      badgeType: pendingOrders.length > 0 ? 'warning' : 'success',
      icon: <ShoppingBag size={22} />,
      accentBg: '#FFF8E1',
      accentColor: '#F57C00',
      details: [
        { label: 'Awaiting Verification', value: `${pendingOrders.length} orders` },
        { label: 'Processing / Shipped', value: `${paidOrders.length + shippedOrders.length} orders` }
      ]
    },
    {
      title: 'Customer Accounts',
      value: Math.max(uniqueCustomerEmails.size, orders.length > 0 ? uniqueCustomerEmails.size : 0).toString(),
      badge: `${orders.length} orders placed`,
      badgeType: 'info',
      icon: <Users size={22} />,
      accentBg: '#EDE7F6',
      accentColor: '#673AB7',
      details: [
        { label: 'Unique Buyers', value: `${uniqueCustomerEmails.size} customers` },
        { label: 'Repeat Orders', value: `${Math.max(0, orders.length - uniqueCustomerEmails.size)} re-orders` }
      ]
    },
    {
      title: 'Catalog & Workshops',
      value: (products.length + tutorials.length).toString(),
      badge: `${products.length} products · ${tutorials.length} workshops`,
      badgeType: 'success',
      icon: <Layers size={22} />,
      accentBg: '#E8F5E9',
      accentColor: '#2E7D32',
      details: [
        { label: 'Handmade Crafts', value: `${products.length} in shop` },
        { label: 'Tutorials / Guides', value: `${paidTutorials} paid · ${freeTutorials} free` }
      ]
    }
  ]

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'warning':
        return { bg: '#FFF3E0', text: '#E65100', border: '#FFE0B2' }
      case 'success':
        return { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' }
      case 'info':
        return { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB' }
      default:
        return { bg: '#F3EDF8', text: 'var(--color-brand)', border: '#E4D6F0' }
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: '#E8F5E9', text: '#2E7D32' }
      case 'PAID':
        return { bg: '#EDE7F6', text: '#5E35B1' }
      case 'SHIPPED':
        return { bg: '#E3F2FD', text: '#1565C0' }
      default:
        return { bg: '#FFF3E0', text: '#E65100' }
    }
  }

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', margin: '0 0 4px' }}>
            Overview
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Real-time business performance, revenue, orders, and studio catalog.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-text)',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Enhanced Stat Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '36px'
        }}
      >
        {statCards.map((card, i) => {
          const badge = getBadgeStyle(card.badgeType)
          return (
            <div
              key={i}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '18px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div>
                {/* Header: Icon & Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: card.accentBg,
                      color: card.accentColor,
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {card.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: badge.text,
                      backgroundColor: badge.bg,
                      border: `1px solid ${badge.border}`,
                      padding: '4px 10px',
                      borderRadius: '50px',
                      letterSpacing: '0.2px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Title & Primary Value */}
                <h3 style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                  {card.title}
                </h3>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: '16px' }}>
                  {loading ? '…' : card.value}
                </div>
              </div>

              {/* Better Detail Breakdown Pill List */}
              <div
                style={{
                  borderTop: '1px dashed var(--color-border)',
                  paddingTop: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {card.details.map((detail, dIdx) => (
                  <div
                    key={dIdx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {detail.label}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                      {loading ? '—' : detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders Quick View */}
      <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '20px', color: 'var(--color-text)', margin: '0 0 4px' }}>
              Recent Orders
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Latest customer purchases and workshop enrollments.
            </p>
          </div>
          <Link
            to="/admin/orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--color-brand)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-lavender-light)'
            }}
          >
            Manage All Orders <ArrowUpRight size={15} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px', padding: '36px 0', textAlign: 'center' }}>
            {loading ? 'Loading orders from server...' : 'No orders recorded yet.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => {
                  const statusStyle = getStatusStyle(order.status)
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-text)' }}>
                        {order.id}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{order.customer}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{order.email}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                        {order.date}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-brand)' }}>
                        Rs {Number(order.total || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '50px',
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
