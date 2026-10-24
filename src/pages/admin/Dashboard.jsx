import React from 'react'
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react'

export default function Dashboard() {
  const metrics = [
    { title: 'Total Revenue', value: '₹45,231', change: '+12.5%', isPositive: true, icon: <DollarSign size={24} /> },
    { title: 'Active Orders', value: '12', change: '+2', isPositive: true, icon: <ShoppingBag size={24} /> },
    { title: 'New Customers', value: '48', change: '+18%', isPositive: true, icon: <Users size={24} /> },
    { title: 'Tutorials Unlocked', value: '156', change: '+24%', isPositive: true, icon: <TrendingUp size={24} /> },
  ]

  return (
    <div>
      <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '32px' }}>Overview</h2>
      
      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {metrics.map((metric, i) => (
          <div key={i} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-lavender-light)', color: 'var(--color-brand)', borderRadius: '12px' }}>
                {metric.icon}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: metric.isPositive ? '#2E7D32' : '#e74c3c', backgroundColor: metric.isPositive ? '#E8F5E9' : '#FFF5F5', padding: '4px 8px', borderRadius: '50px' }}>
                {metric.change}
              </span>
            </div>
            <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '8px' }}>{metric.title}</h3>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)' }}>{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Mock Chart Area */}
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>Sales Chart Placeholder</p>
      </div>
    </div>
  )
}
