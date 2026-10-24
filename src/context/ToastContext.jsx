import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message, type = 'info', duration = 3200) => {
    const id = ++toastId
    setToasts((prev) => [...prev.slice(-4), { id, message, type }])
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const api = useMemo(() => ({
    push,
    success: (message, duration) => push(message, 'success', duration),
    error: (message, duration) => push(message, 'error', duration),
    info: (message, duration) => push(message, 'info', duration),
    dismiss,
  }), [push, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-host" aria-live="polite" aria-relevant="additions">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`toast toast--${toast.type}`}
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              layout
            >
              <span className="toast__icon" aria-hidden="true">
                {toast.type === 'success' && <CheckCircle2 size={18} strokeWidth={2} />}
                {toast.type === 'error' && <AlertCircle size={18} strokeWidth={2} />}
                {toast.type === 'info' && <Info size={18} strokeWidth={2} />}
              </span>
              <p className="toast__message">{toast.message}</p>
              <button
                type="button"
                className="toast__close"
                aria-label="Dismiss"
                onClick={() => dismiss(toast.id)}
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
