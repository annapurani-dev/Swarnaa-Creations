import React, { useState } from 'react'
import { Search, Eye, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

export default function OrdersAdmin() {
  const [mockOrders, setMockOrders] = useState([
    { id: '#SW-1042', customer: 'Jane Doe', date: '12 Oct 2026', status: 'Processing', total: 3600, items: 2 },
    { id: '#SW-0921', customer: 'John Smith', date: '28 Sep 2026', status: 'Delivered', total: 1200, items: 1 },
    { id: '#SW-0910', customer: 'Alice Wong', date: '15 Sep 2026', status: 'Shipped', total: 4500, items: 3 },
  ])

  const [filter, setFilter] = useState('All')

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return { bg: '#E8F5E9', text: '#2E7D32' }
      case 'Processing': return { bg: '#FFF3E0', text: '#E65100' }
      case 'Shipped': return { bg: '#E3F2FD', text: '#1565C0' }
      default: return { bg: '#F5F5F5', text: '#757575' }
    }
  }

  const handleStatusChange = (id, newStatus) => {
    setMockOrders(prev => prev.map(order => order.id === id ? { ...order, status: newStatus } : order))
  }

  const filteredOrders = filter === 'All' ? mockOrders : mockOrders.filter(o => o.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>Order Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>View and update customer orders.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search orders..." style={{ padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none' }} />
          </div>
          <select 
            value={filter} onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: 'white', cursor: 'pointer' }}
          >
            <option value="All">All Statuses</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Order ID</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Customer</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, i) => (
              <tr key={order.id} style={{ borderBottom: i === filteredOrders.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{order.id}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text)' }}>{order.customer}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{order.date}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>₹{order.total}</td>
                <td style={{ padding: '16px 24px' }}>
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    style={{ 
                      padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none', cursor: 'pointer', outline: 'none',
                      backgroundColor: getStatusColor(order.status).bg, color: getStatusColor(order.status).text 
                    }}
                  >
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--color-brand)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                    <Eye size={16} /> View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No orders found matching the filter.
          </div>
        )}
      </div>
    </div>
  )
}
