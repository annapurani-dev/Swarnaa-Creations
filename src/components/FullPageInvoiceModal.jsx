import React, { useRef } from 'react'
import { Printer, Download, X, CheckCircle, BookOpen } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { WHATSAPP_NUMBER } from '../lib/whatsapp'

/**
 * FullPageInvoiceModal
 * 
 * Automatically switches between:
 * 1. Short E-Receipt: For digital tutorial purchases (clean, compact card format with unlock status & instant access).
 * 2. Full Page A4 Official Invoice: For physical crafts and commission orders.
 */
export default function FullPageInvoiceModal({ order, onClose }) {
  const documentRef = useRef(null)

  if (!order) return null

  const isTutorial = Boolean(order.hasTutorial && !order.hasProduct)
  const isCustomCommission = Boolean(order.requestId || order.orderVolume)

  // Format invoice number strictly as SC-0001
  const rawId = order.originalId || order.id || 1
  const numOnly = String(rawId).replace(/\D/g, '') || '1'
  const invNumber = order.invoiceNumber && order.invoiceNumber.startsWith('SC-')
    ? order.invoiceNumber
    : `SC-${String(numOnly).slice(-4).padStart(4, '0')}`

  const orderDate = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent')

  // Dynamic phone from env/lib
  const displayPhone = WHATSAPP_NUMBER ? `+${WHATSAPP_NUMBER}` : '+91 9445542398'

  const handleDownloadPDF = () => {
    if (!documentRef.current) return
    const opt = {
      margin: isTutorial ? [8, 8, 8, 8] : [10, 10, 10, 10],
      filename: `${isTutorial ? 'Receipt' : 'Invoice'}_${invNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: isTutorial ? 'a5' : 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(documentRef.current).save()
  }

  const handlePrint = () => {
    window.print()
  }

  const totalAmount = Number(order.total || order.quotedAmount || order.budget || 0)
  const subtotal = totalAmount
  const shippingCharge = 0

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: isTutorial ? '560px' : '860px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          transition: 'max-width 0.2s ease'
        }}
      >
        {/* Top Control Bar (Hidden from Print) */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            backgroundColor: '#F8F9FA',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                padding: '3px 10px',
                borderRadius: '50px',
                backgroundColor: isTutorial ? '#EFF6FF' : '#FDF2F8',
                color: isTutorial ? '#1D4ED8' : 'var(--color-brand)',
                border: `1px solid ${isTutorial ? '#BFDBFE' : '#FCE7F3'}`
              }}
            >
              {isTutorial ? 'PAYMENT RECEIPT' : (isCustomCommission ? 'BESPOKE COMMISSION INVOICE' : 'INVOICE')}
            </span>
            <span style={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>
              {invNumber}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDownloadPDF}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                backgroundColor: isTutorial ? '#1D4ED8' : 'var(--color-brand)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                border: '1px solid #D1D5DB',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: '#9CA3AF'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div style={{ overflowY: 'auto', padding: isTutorial ? '24px' : '36px', backgroundColor: '#F3F4F6' }}>
          
          {/* ========================================================
              1. SHORT RECEIPT FORMAT (FOR TUTORIALS)
             ======================================================== */}
          {isTutorial ? (
            <div
              ref={documentRef}
              id="printable-fullpage-invoice"
              style={{
                backgroundColor: '#FFFFFF',
                padding: '32px 28px',
                borderRadius: '12px',
                maxWidth: '480px',
                margin: '0 auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#1F2937',
                lineHeight: 1.5
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #E5E7EB', paddingBottom: '20px', marginBottom: '20px' }}>
                <img
                  src="/brand-emblem.png"
                  alt="Swarnaa Creations"
                  style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto 8px', display: 'block' }}
                />
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--color-brand)', letterSpacing: '0.5px' }}>
                  SWARNAA CREATIONS
                </h2>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                  Online Academy & Handcraft Studio
                </div>
                <div style={{ marginTop: '10px', display: 'inline-block', padding: '3px 12px', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderRadius: '50px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4B5563', marginBottom: '16px' }}>
                <div>
                  <div>Receipt No: <strong style={{ color: '#111827' }}>{invNumber}</strong></div>
                  <div>Date: <strong>{orderDate}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Status: <strong style={{ color: '#047857' }}>Verified (Paid)</strong></div>
                  <div>Access: <strong style={{ color: '#1D4ED8' }}>Unlocked ✓</strong></div>
                </div>
              </div>

              {/* Student / Customer details */}
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Student / Customer
                </div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '13px' }}>
                  {order.customer || order.customerName || 'Valued Learner'}
                </div>
                <div style={{ color: '#6B7280' }}>
                  {order.email || order.customerEmail || '—'}
                </div>
              </div>

              {/* Tutorial Item Details */}
              <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '14px 0', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Tutorial Details
                </div>
                {order.itemsList && order.itemsList.length > 0 ? (
                  order.itemsList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>Digital Video Class + Pattern PDF</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                        Rs {Number(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{order.items || 'Tutorial Access'}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Digital Workshop Access</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                      Rs {totalAmount.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Total Paid */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Total Paid</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#1D4ED8' }}>
                  Rs {totalAmount.toLocaleString()}
                </span>
              </div>

              {/* Access note */}
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#166534', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} style={{ flexShrink: 0 }} />
                <span>You have lifetime access to this tutorial under <strong>My Learning</strong>.</span>
              </div>

              {/* Computer Generated Notice & Footer */}
              <div style={{ textAlign: 'center', borderTop: '1px dashed #E5E7EB', paddingTop: '16px' }}>
                <div style={{ fontSize: '10px', color: '#9CA3AF', fontStyle: 'italic', marginBottom: '8px' }}>
                  This is a computer-generated receipt and does not require a physical signature.
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1D4ED8', letterSpacing: '0.2px' }}>
                  Happy Learning & Happy Crafting ♡
                </div>
              </div>
            </div>

          ) : (

            /* ========================================================
                2. FULL-PAGE A4 TAX INVOICE (FOR PRODUCTS & COMMISSIONS)
               ======================================================== */
            <div
              ref={documentRef}
              id="printable-fullpage-invoice"
              style={{
                backgroundColor: '#FFFFFF',
                padding: '44px',
                borderRadius: '8px',
                maxWidth: '800px',
                margin: '0 auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#1F2937',
                lineHeight: 1.5
              }}
            >
              {/* Header: Logo & Slogan on Left Top, INVOICE on Right Top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E5E7EB', paddingBottom: '24px', marginBottom: '24px' }}>
                <div style={{ maxWidth: '440px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                    <img
                      src="/brand-emblem.png"
                      alt="Swarnaa Creations Logo"
                      style={{
                        width: '54px',
                        height: '54px',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                    <div>
                      <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: 'var(--color-brand)', letterSpacing: '0.8px', fontFamily: "'Playfair Display', serif" }}>
                        SWARNAA CREATIONS
                      </h1>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6F6872', fontWeight: 600, fontStyle: 'italic' }}>
                        Handcrafted with Love, Stitched for Memories
                      </p>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.6, marginTop: '10px' }}>
                    <div>31, Thiruvalluvar Street, New Perungalathur, Chennai - 600063</div>
                    <div>Phone / WhatsApp: <strong>{displayPhone}</strong></div>
                    <div>Email: <strong>support@swarnaacreations.com</strong> • Web: <strong>www.swarnaacreations.com</strong></div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      color: '#111827',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                  >
                    INVOICE
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '15px', fontWeight: 800, color: 'var(--color-brand)' }}>
                    {invNumber}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#6B7280' }}>
                    Date: <strong>{orderDate}</strong>
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '12px', color: '#6B7280' }}>
                    Payment: <strong style={{ color: '#047857' }}>Verified (PAID)</strong>
                  </div>
                </div>
              </div>

              {/* Billing & Shipping Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '28px', backgroundColor: '#F9FAFB', padding: '18px 22px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    CUSTOMER DETAILS / BILLED TO
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                    {order.customer || order.customerName || 'Valued Customer'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5 }}>
                    <div>Email: {order.email || order.customerEmail || '—'}</div>
                    {(order.phone || order.customerPhone) && <div>Phone: {order.phone || order.customerPhone}</div>}
                    {order.requestId && <div>Commission Ref: <strong>{order.requestId}</strong></div>}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    SHIPPING DESTINATION
                  </div>
                  <div style={{ fontSize: '13px', color: '#1F2937', lineHeight: 1.5 }}>
                    {order.shippingAddress ? (
                      <>
                        <div style={{ fontWeight: 600 }}>{order.shippingAddress}</div>
                        <div>{[order.shippingCity, order.shippingState, order.shippingPincode].filter(Boolean).join(', ')}</div>
                      </>
                    ) : (
                      <div style={{ color: '#6B7280', fontStyle: 'italic' }}>
                        Hand-packed custom commission. Delivery coordinated directly via WhatsApp / phone.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom order specific banner (if custom order) */}
              {isCustomCommission && order.description && (
                <div style={{ marginBottom: '24px', padding: '12px 16px', backgroundColor: '#FDF2F8', borderLeft: '4px solid var(--color-brand)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Personalization / Custom Commission Note
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic' }}>
                    "{order.description}"
                  </div>
                  {order.deadline && (
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                      Event / Target Delivery Date: <strong>{order.deadline}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Itemized Table */}
              <div style={{ marginBottom: '28px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3EDF8', borderBottom: '2px solid #D9D0E3' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', width: '50px' }}>#</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Item & Description</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#374151', width: '90px' }}>Type</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#374151', width: '60px' }}>Qty</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#374151', width: '110px' }}>Unit Price</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#374151', width: '120px' }}>Amount (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.itemsList && order.itemsList.length > 0 ? (
                      order.itemsList.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '12px 14px', color: '#6B7280', verticalAlign: 'top' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                              Handcrafted Original Art Piece
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: '#6B7280', verticalAlign: 'top' }}>
                            {item.type || 'Product'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#111827', verticalAlign: 'top' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4B5563', verticalAlign: 'top' }}>
                            Rs {Number(item.price).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#111827', verticalAlign: 'top' }}>
                            Rs {(item.price * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px 14px', color: '#6B7280', verticalAlign: 'top' }}>1</td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                            {isCustomCommission ? (order.orderVolume === 'bulk' ? 'Bulk Handmade Commission' : 'Custom Bespoke Craft') : (order.items || 'Handcrafted Order')}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                            {isCustomCommission ? order.description : 'Authentic Swarnaa Creations original craftsmanship'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#6B7280', verticalAlign: 'top' }}>
                          Craft
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#111827', verticalAlign: 'top' }}>
                          {order.quantity || 1}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4B5563', verticalAlign: 'top' }}>
                          Rs {totalAmount.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#111827', verticalAlign: 'top' }}>
                          Rs {totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calculations & Total Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                <div style={{ width: '320px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#4B5563' }}>
                    <span>Subtotal</span>
                    <span>Rs {subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#4B5563' }}>
                    <span>Shipping & Packaging</span>
                    <span style={{ color: '#047857', fontWeight: 600 }}>{shippingCharge === 0 ? 'FREE' : `Rs ${shippingCharge}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>
                    <span>Taxes (GST Inclusive)</span>
                    <span>Rs 0.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '18px', fontWeight: 900, color: 'var(--color-brand)' }}>
                    <span>Total Amount</span>
                    <span>Rs {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Computer Generated Notice & Footer */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px', marginTop: '28px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', marginBottom: '14px' }}>
                  This is a computer-generated invoice and does not require a physical signature.
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-brand)', letterSpacing: '0.3px' }}>
                  Thank you for shopping with us ♡
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
