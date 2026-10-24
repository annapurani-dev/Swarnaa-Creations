/** Business WhatsApp number in international format, digits only */
export const WHATSAPP_NUMBER =
  (import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210').replace(/\D/g, '')

export function whatsappUrl(message = '') {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

export const WHATSAPP_DEFAULT_MESSAGE =
  'Hi Swarnaa Creations! I’d like to know more about your handmade crafts.'
