const EVENT = 'swarnaa:categories-changed'

/** Notify open admin pages that categories were created/deleted. */
export function notifyCategoriesChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail }))
}

export function onCategoriesChanged(handler) {
  const fn = (e) => handler(e.detail || {})
  window.addEventListener(EVENT, fn)
  return () => window.removeEventListener(EVENT, fn)
}
