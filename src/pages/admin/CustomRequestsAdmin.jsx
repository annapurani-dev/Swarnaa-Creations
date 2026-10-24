import React, { useState } from 'react'
import { Check, X, MessageSquare, Paperclip, MessageCircle } from 'lucide-react'
import { whatsappUrl } from '../../lib/whatsapp'

export default function CustomRequestsAdmin() {
  const [requests, setRequests] = useState([
    {
      id: 'REQ-109',
      customer: 'Emily Chen',
      email: 'emily.chen@example.com',
      date: '19 Sep 2026',
      type: 'Single Piece',
      deadline: '15 Oct 2026',
      budget: '₹8,000',
      description: 'I would like a custom resin coaster set with real dried lavender and gold flakes to match my new dining table.',
      status: 'Pending'
    },
    {
      id: 'REQ-108',
      customer: 'Sarah Williams',
      email: 'swilliams88@example.com',
      date: '18 Sep 2026',
      type: 'Bulk Order (50x)',
      deadline: '20 Nov 2026',
      budget: '₹45,000',
      description: 'Corporate gifting for our year-end party. Looking for customized macrame keychains with our company colors (blue and silver).',
      status: 'Quoted'
    }
  ])

  const handleAction = (id, action) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: action } : req))
  }

  const getStatusBadge = (status) => {
    if (status === 'Pending') return <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>New</span>
    if (status === 'Quoted') return <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Quoted</span>
    if (status === 'Declined') return <span style={{ backgroundColor: '#FFF5F5', color: '#e74c3c', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Declined</span>
    return null
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>Custom Commissions</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>Review and quote bespoke customer requests.</p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {requests.map(req => (
          <div key={req.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', padding: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{req.customer}</h3>
                  {getStatusBadge(req.status)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {req.email} • Submitted {req.date}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{req.id}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-brand)' }}>{req.type}</div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-lavender-light)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text)', fontStyle: 'italic' }}>
                "{req.description}"
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Deadline</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{req.deadline}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Expected Budget</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{req.budget}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Attachments</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <Paperclip size={14} /> 2 files
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {req.status === 'Pending' && (
                <>
                  <button onClick={() => handleAction(req.id, 'Declined')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <X size={16} /> Decline
                  </button>
                  <a href={whatsappUrl(`Hi ${req.customer}, we received your custom order request (${req.id}) on Swarnaa Creations.`)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#25D366', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <button onClick={() => handleAction(req.id, 'Quoted')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} /> Send Quote
                  </button>
                </>
              )}
              {req.status === 'Quoted' && (
                <div style={{ fontSize: '14px', color: '#1565C0', fontWeight: 500 }}>
                  Quote sent. Waiting for customer response.
                </div>
              )}
              {req.status === 'Declined' && (
                <div style={{ fontSize: '14px', color: '#e74c3c', fontWeight: 500 }}>
                  Request declined.
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
