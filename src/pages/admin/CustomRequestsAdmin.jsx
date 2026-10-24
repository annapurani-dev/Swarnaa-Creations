import React, { useEffect, useState } from 'react'
import {
  Check,
  X,
  MessageSquare,
  Paperclip,
  MessageCircle,
  RefreshCw,
  Upload,
  FileText,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { whatsappUrl } from '../../lib/whatsapp'
import {
  fetchCustomRequests,
  updateCustomRequestStatus,
  quoteCustomRequest,
  uploadCustomRequestPaymentProof
} from '../../api'
import { useToast } from '../../context/ToastContext'
import FullPageInvoiceModal from '../../components/FullPageInvoiceModal'

export default function CustomRequestsAdmin() {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  // Quote Dialog Modal State
  const [quotingReq, setQuotingReq] = useState(null)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [savingQuote, setSavingQuote] = useState(false)

  // Payment Proof Modal State
  const [payingReq, setPayingReq] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [uploadingProof, setUploadingProof] = useState(false)

  // View Invoice Modal State
  const [viewInvoiceReq, setViewInvoiceReq] = useState(null)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await fetchCustomRequests()
      setRequests(data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load custom requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleAction = async (id, action) => {
    try {
      await updateCustomRequestStatus(id, action)
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action } : r))
      )
      toast.success(`Request marked as ${action}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  const handleOpenQuoteModal = (req) => {
    setQuotingReq(req)
    setQuotePrice(req.quotedAmount || req.budget || '')
    setQuoteNotes(req.adminNotes || '')
  }

  const handleSaveQuote = async (e) => {
    e.preventDefault()
    if (!quotePrice) {
      toast.error('Please enter the confirmed quote amount in Rs')
      return
    }
    setSavingQuote(true)
    try {
      const updated = await quoteCustomRequest(quotingReq.id, {
        quotedAmount: quotePrice,
        adminNotes: quoteNotes,
      })
      setRequests((prev) =>
        prev.map((r) => (r.id === quotingReq.id ? { ...r, ...updated, status: 'Quoted' } : r))
      )
      toast.success(`Quote of Rs ${quotePrice} recorded for ${quotingReq.requestId}`)
      setQuotingReq(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to record quote')
    } finally {
      setSavingQuote(false)
    }
  }

  const handleUploadPaymentProof = async (e) => {
    e.preventDefault()
    if (!proofFile) {
      toast.error('Please select the payment screenshot')
      return
    }
    setUploadingProof(true)
    try {
      const updated = await uploadCustomRequestPaymentProof(payingReq.id, proofFile)
      setRequests((prev) =>
        prev.map((r) => (r.id === payingReq.id ? { ...r, ...updated, status: 'Paid' } : r))
      )
      toast.success('Payment verified! Invoice generated and confirmation email dispatched.')
      setPayingReq(null)
      setProofFile(null)
      // Open invoice view modal directly for printing/review
      setViewInvoiceReq(updated)
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload payment proof')
    } finally {
      setUploadingProof(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'Pending')
      return <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 700 }}>New</span>
    if (status === 'Quoted')
      return <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 700 }}>Quoted</span>
    if (status === 'Paid')
      return <span style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 700 }}>Paid / Invoiced</span>
    if (status === 'Declined')
      return <span style={{ backgroundColor: '#FFF5F5', color: '#e74c3c', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 700 }}>Declined</span>
    return null
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>Custom Commissions</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>Review inquiries, add final quotes, confirm payments, and auto-issue invoices.</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading inquiries…</div>
      ) : requests.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', backgroundColor: 'white', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 15 }}>No custom commission inquiries yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {requests.map(req => {
            let images = []
            try {
              images = req.imageUrls ? JSON.parse(req.imageUrls) : []
            } catch {
              images = []
            }

            const formattedDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
            const orderTypeLabel = req.orderVolume === 'bulk' ? `Bulk Order (${req.quantity}x)` : 'Single Piece'
            
            // Price Display Logic: Empty until admin quotes
            let priceDisplay = 'Pending Admin Quote'
            if (req.quotedAmount) {
              priceDisplay = `Rs ${req.quotedAmount} (Confirmed)`
            } else if (req.budget) {
              priceDisplay = `Rs ${req.budget} (Customer target)`
            }

            return (
              <div key={req.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', padding: '24px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{req.customerName}</h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {req.customerEmail} {req.customerPhone ? `• ${req.customerPhone}` : ''} • Submitted {formattedDate}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{req.requestId}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-brand)' }}>{orderTypeLabel}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-lavender-light)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text)', fontStyle: 'italic' }}>
                    "{req.description}"
                  </p>
                  {req.adminNotes && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 13, color: 'var(--color-brand)', fontWeight: 600 }}>
                      Admin Quote Note: {req.adminNotes}
                    </div>
                  )}
                </div>

                {/* Attached Images */}
                {images.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Paperclip size={14} /> Reference Photos ({images.length})
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {images.map((imgUrl, idx) => (
                        <a
                          key={idx}
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: '1px solid var(--color-border)',
                            display: 'block'
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt="Reference"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detail Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Target Deadline</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{req.deadline || 'Flexible / Open'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Quoted Price</div>
                    <div style={{ fontSize: '14px', fontWeight: req.quotedAmount ? 700 : 500, color: req.quotedAmount ? 'var(--color-brand)' : '#D97706' }}>
                      {priceDisplay}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Quantity</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{req.quantity} piece(s)</div>
                  </div>
                  {req.invoiceNumber && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Invoice</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#047857' }}>{req.invoiceNumber} (Sent)</div>
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {req.status === 'Pending' && (
                    <>
                      <button onClick={() => handleAction(req.id, 'Declined')} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <X size={15} /> Decline
                      </button>
                      <a href={whatsappUrl(`Hi ${req.customerName}, we received your custom order inquiry (${req.requestId}) on Swarnaa Creations.`)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#25D366', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageCircle size={15} /> WhatsApp Customer
                      </a>
                      <button onClick={() => handleOpenQuoteModal(req)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={15} /> Mark as Quoted
                      </button>
                    </>
                  )}

                  {req.status === 'Quoted' && (
                    <>
                      <span style={{ fontSize: '13px', color: '#1565C0', fontWeight: 500, marginRight: 'auto' }}>
                        Quote of Rs {req.quotedAmount || '0'} sent. Awaiting customer payment.
                      </span>
                      <button onClick={() => handleOpenQuoteModal(req)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Edit Quote
                      </button>
                      <a href={whatsappUrl(`Hi ${req.customerName}, following up regarding your quote of Rs ${req.quotedAmount || ''} for (${req.requestId}).`)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#25D366', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                      <button onClick={() => { setPayingReq(req); setProofFile(null); }} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={15} /> Upload Payment Screenshot
                      </button>
                    </>
                  )}

                  {req.status === 'Paid' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto', color: '#047857', fontSize: 13, fontWeight: 600 }}>
                        <CheckCircle2 size={16} /> Paid & Confirmed • Auto-email sent to {req.customerEmail}
                      </div>
                      {req.paymentProofUrl && (
                        <a href={req.paymentProofUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', fontSize: '13px', fontWeight: 600 }}>
                          View Payment Proof
                        </a>
                      )}
                      <button onClick={() => setViewInvoiceReq(req)} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={15} /> View / Print Invoice
                      </button>
                    </>
                  )}

                  {req.status === 'Declined' && (
                    <div style={{ fontSize: '14px', color: '#e74c3c', fontWeight: 500 }}>
                      Request declined.
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* 1. Modal: Enter Final Quoted Price */}
      {quotingReq && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                Quote Final Price for {quotingReq.requestId}
              </h3>
              <button type="button" onClick={() => setQuotingReq(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>×</button>
            </div>

            <form onSubmit={handleSaveQuote}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  Confirmed Amount (in Rs) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="Enter final price, e.g. 1800"
                  style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 15 }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  Quote / Artisan Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Includes custom rose charm and gold thread initials..."
                  style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setQuotingReq(null)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingQuote} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', cursor: savingQuote ? 'wait' : 'pointer', fontWeight: 600, fontSize: 14 }}>
                  {savingQuote ? 'Saving Quote…' : 'Confirm & Save Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Upload Payment Proof Screenshot */}
      {payingReq && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                Upload Payment Proof ({payingReq.requestId})
              </h3>
              <button type="button" onClick={() => setPayingReq(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>×</button>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Attach the customer's UPI/bank payment screenshot. Once saved, an invoice is generated automatically and sent to <strong>{payingReq.customerEmail}</strong>.
            </p>

            <form onSubmit={handleUploadPaymentProof}>
              <div style={{ padding: 24, border: '2px dashed var(--color-border)', borderRadius: 12, backgroundColor: '#FAF7FC', textAlign: 'center', marginBottom: 24 }}>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  id="payment-proof-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="payment-proof-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Upload size={28} color="var(--color-brand)" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-brand)' }}>
                    {proofFile ? proofFile.name : 'Click to select payment screenshot'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>PNG, JPG, or PDF</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setPayingReq(null)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  Cancel
                </button>
                <button type="submit" disabled={uploadingProof} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: '#10B981', color: 'white', cursor: uploadingProof ? 'wait' : 'pointer', fontWeight: 600, fontSize: 14 }}>
                  {uploadingProof ? 'Processing…' : 'Verify & Send Invoice Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Full-page A4 Invoice & Receipt Modal */}
      {viewInvoiceReq && (
        <FullPageInvoiceModal
          order={viewInvoiceReq}
          onClose={() => setViewInvoiceReq(null)}
        />
      )}
    </div>
  )
}

