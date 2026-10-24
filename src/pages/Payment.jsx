import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Copy, Smartphone, UploadCloud } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLearning } from '../context/LearningContext'
import { useToast } from '../context/ToastContext'
import ScrollReveal from '../components/ScrollReveal'
import { initiateOrder, confirmOrderPayment } from '../api'

export default function Payment() {
  const { cartItems, clearCart } = useCart()
  const { isLoggedIn, user } = useAuth()
  const { unlockTutorials } = useLearning()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const orderRequestRef = useRef({ key: null, promise: null })

  const formData = location.state?.formData
  const isBuyNow = Boolean(location.state?.isBuyNow)
  const checkoutItems = location.state?.checkoutItems?.length
    ? location.state.checkoutItems
    : cartItems

  const [screenshot, setScreenshot] = useState(null)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [retryNonce, setRetryNonce] = useState(0)

  const checkoutTotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems]
  )

  const requestKey = useMemo(() => {
    if (!formData || checkoutItems.length === 0) return null
    return JSON.stringify({
      name: formData.name,
      phone: formData.phone,
      email: user?.email || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      pincode: formData.pincode || '',
      buyNow: isBuyNow,
      items: checkoutItems.map((item) => ({
        id: item.product?.id,
        q: item.quantity,
        p: item.price,
        s: item.packSize,
      })),
    })
  }, [formData, checkoutItems, user?.email, isBuyNow])

  useEffect(() => {
    if (!isLoggedIn || !formData || checkoutItems.length === 0) {
      navigate(isBuyNow ? '/shop' : '/cart')
    }
  }, [isLoggedIn, checkoutItems.length, formData, navigate, isBuyNow])

  useEffect(() => {
    if (!isLoggedIn || !formData || !requestKey) return undefined

    let cancelled = false
    setLoading(true)
    setError('')

    if (orderRequestRef.current.key !== requestKey) {
      orderRequestRef.current = {
        key: requestKey,
        promise: initiateOrder({
          customerName: formData.name,
          customerEmail: user?.email || `${formData.phone || 'guest'}@swarnaa.local`,
          customerPhone: formData.phone,
          shippingAddress: formData.address || '',
          shippingCity: formData.city || '',
          shippingState: formData.state || '',
          shippingPincode: formData.pincode || '',
          items: checkoutItems.map((item) => ({
            productId: item.product?.id,
            tutorialId: item.packSize === 'digital' ? item.product?.id : null,
            packSize: item.packSize,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      }
    }

    orderRequestRef.current.promise
      .then((order) => {
        if (cancelled) return
        setPendingOrder(order)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        orderRequestRef.current = { key: null, promise: null }
        setError(err.message || 'Could not start payment. Please try again.')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [isLoggedIn, formData, requestKey, checkoutItems, user?.email, retryNonce])

  if (!isLoggedIn || checkoutItems.length === 0 || !formData) {
    return null
  }

  const totalAmount = pendingOrder?.totalAmount ?? checkoutTotal
  const upiDeepLink = pendingOrder?.upiDeepLink || ''
  const upiId = pendingOrder?.upiId || ''

  const handleConfirmPayment = async () => {
    if (!screenshot) {
      toast.error('Please upload a screenshot of your payment first.')
      return
    }
    if (!pendingOrder?.id) {
      toast.error('Order is not ready yet. Please wait a moment and try again.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const tutorialIdsFromOrder = checkoutItems
        .filter((item) => item.packSize === 'digital' || item.tutorialId)
        .map((item) => item.tutorialId || item.product?.id)
        .filter(Boolean)

      const result = await confirmOrderPayment(pendingOrder.id, screenshot)
      const unlockedIds = result.unlockedTutorialIds?.length
        ? result.unlockedTutorialIds
        : tutorialIdsFromOrder

      if (unlockedIds.length) {
        unlockTutorials(unlockedIds)
      }

      // Cart checkout clears cart; Buy Now leaves the cart alone
      if (!isBuyNow) {
        clearCart()
      }

      navigate('/order-success', {
        state: {
          orderId: pendingOrder.displayId,
          totalAmount: pendingOrder.totalAmount,
          unlockedTutorialIds: unlockedIds,
        },
      })
    } catch (err) {
      setError(err.message || 'Could not submit payment proof.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0])
    }
  }

  const copyUpi = async () => {
    if (!upiId) return
    try {
      await navigator.clipboard.writeText(upiId)
      toast.success('UPI ID copied')
    } catch {
      toast.error('Could not copy UPI ID')
    }
  }

  return (
    <div className="page payment-page">
      <div className="container payment-page__wrap">
        <ScrollReveal y={10}>
          <button
            type="button"
            className="payment-page__back"
            onClick={() => navigate('/checkout', {
              state: isBuyNow
                ? { buyNowItem: checkoutItems[0] }
                : undefined,
            })}
          >
            <ArrowLeft size={16} /> Back to checkout
          </button>
        </ScrollReveal>

        <ScrollReveal y={14} delay={0.03} className="payment-page__head">
          <div>
            <h1 className="payment-page__title">Complete payment</h1>
            <p className="payment-page__lead">
              Pay with UPI, then upload your screenshot to confirm.
            </p>
          </div>
          {pendingOrder?.displayId && (
            <div className="payment-page__order-chip">
              Order {pendingOrder.displayId}
            </div>
          )}
        </ScrollReveal>

        {loading ? (
          <ScrollReveal y={18} delay={0.06} className="payment-page__status">
            Preparing your secure UPI payment…
          </ScrollReveal>
        ) : error && !pendingOrder ? (
          <ScrollReveal y={18} delay={0.06} className="payment-page__status">
            <p className="payment-page__error">{error}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                orderRequestRef.current = { key: null, promise: null }
                setError('')
                setRetryNonce((n) => n + 1)
              }}
            >
              Try again
            </button>
          </ScrollReveal>
        ) : (
          <ScrollReveal y={20} delay={0.06} className="payment-layout">
            {/* Column 1 — Order */}
            <section className="payment-panel payment-panel--order" aria-label="Order summary">
              <header className="payment-order-head">
                <h2 className="payment-panel__title">Your order</h2>
                <span className="payment-order-count">
                  {checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'items'}
                </span>
              </header>

              <ul className="payment-order-list">
                {checkoutItems.map((item) => (
                  <li key={item.id} className="payment-order-item">
                    <div className="payment-order-item__media">
                      {item.product?.image ? (
                        <img src={item.product.image} alt="" />
                      ) : (
                        <span className="payment-order-item__placeholder" aria-hidden="true" />
                      )}
                    </div>
                    <div className="payment-order-item__body">
                      <p className="payment-order-item__name">
                        {item.product?.name || item.product?.title}
                      </p>
                      <p className="payment-order-item__meta">
                        <span>
                          {item.packSize === 'digital'
                            ? 'Tutorial'
                            : item.packSize === 'bulk'
                              ? 'Bulk'
                              : 'Product'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Qty {item.quantity}</span>
                        <span aria-hidden="true">·</span>
                        <span>₹{item.price} each</span>
                      </p>
                    </div>
                    <span className="payment-order-item__price">
                      ₹{item.price * item.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="payment-order-foot">
                <div className="payment-order-total">
                  <div>
                    <span className="payment-order-total__label">Amount to pay</span>
                    {pendingOrder?.payeeName && (
                      <p className="payment-order-payee">
                        to {pendingOrder.payeeName}
                      </p>
                    )}
                  </div>
                  <strong className="payment-order-total__value">₹{totalAmount}</strong>
                </div>
              </div>
            </section>

            {/* Column 2 — Pay */}
            <section className="payment-panel payment-panel--pay" aria-label="UPI payment">
              <h2 className="payment-panel__title">1. Pay via UPI</h2>
              <div className="payment-qr">
                {upiDeepLink ? (
                  <QRCodeSVG value={upiDeepLink} size={168} level="M" />
                ) : (
                  <p className="payment-panel__muted">QR unavailable</p>
                )}
              </div>
              <p className="payment-panel__hint">
                Scan with GPay, PhonePe, or Paytm — amount is prefilled.
              </p>
              {upiId && (
                <button type="button" className="payment-upi-id" onClick={copyUpi}>
                  <span>{upiId}</span>
                  <Copy size={14} />
                </button>
              )}
              <a
                href={upiDeepLink || undefined}
                className={`payment-upi-btn${!upiDeepLink ? ' is-disabled' : ''}`}
                aria-disabled={!upiDeepLink}
                onClick={(e) => {
                  if (!upiDeepLink) e.preventDefault()
                }}
              >
                <Smartphone size={18} /> Open UPI app
              </a>
            </section>

            {/* Column 3 — Verify */}
            <section className="payment-panel payment-panel--verify" aria-label="Payment verification">
              <h2 className="payment-panel__title">2. Confirm payment</h2>
              <p className="payment-panel__hint">
                Upload your transaction screenshot after paying.
              </p>

              {error && <p className="payment-page__error">{error}</p>}

              <label htmlFor="screenshot-upload" className="payment-upload">
                <UploadCloud size={28} strokeWidth={1.75} />
                <span className="payment-upload__label">
                  {screenshot ? screenshot.name : 'Upload screenshot'}
                </span>
                {!screenshot && (
                  <span className="payment-upload__meta">JPG, PNG or PDF · max 5MB</span>
                )}
              </label>
              <input
                id="screenshot-upload"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                hidden
              />

              <motion.button
                type="button"
                className="payment-confirm-btn"
                onClick={handleConfirmPayment}
                whileHover={screenshot && !submitting ? { scale: 1.015 } : undefined}
                whileTap={screenshot && !submitting ? { scale: 0.985 } : undefined}
                disabled={!screenshot || submitting || !pendingOrder}
              >
                {submitting ? 'Submitting…' : 'Confirm payment'}
                <CheckCircle size={17} />
              </motion.button>
            </section>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
