import { useEffect, useState } from 'react'
import {
  ImagePlus,
  Trash2,
  Upload,
  Save,
  RotateCcw,
  Sparkles,
  LayoutTemplate,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Eye,
  Star,
  BookOpen,
  Video,
  ShoppingBag,
  Check
} from 'lucide-react'
import {
  deleteHeroImage,
  fetchHeroImages,
  uploadHeroImage,
  fetchHomeContent,
  updateHomeContent,
  fetchProducts,
  fetchTutorials,
  fetchJournals
} from '../../api'
import { useToast } from '../../context/ToastContext'

const DEFAULT_CONTENT = {
  heroTitle: 'Something special is on the way.',
  heroTitleSpan: 'on the way.',
  heroDescription:
    'We’re creating handmade magic to make your moments more special and your gifts more meaningful.',
  heroPrimaryBtn: 'Explore shop',
  heroPrimaryLink: '/shop',
  heroSecondaryBtn: 'Chat on WhatsApp',
  whatsappMessage: 'Hi! I am interested in Swarnaa Creations.',
  customTitle: 'Made for your moment',
  customDesc:
    'Need a one-of-a-kind gift or a bulk set for an event? Tell us what you imagine — we’ll craft it with you.',
  customBtnText: 'Request a custom order',
  closingTitle: 'Find a piece that feels like you.',
  closingDesc: 'Browse the shop, or start a custom conversation.',
  featuredProductIds: [],
  featuredTutorialIds: [],
  featuredJournalIds: []
}

export default function HeroImagesAdmin() {
  const toast = useToast()

  // Tab State
  const [activeTab, setActiveTab] = useState('hero-orbit') // 'hero-orbit' | 'hero-text' | 'sections' | 'featured'

  // Hero Orbit Images State
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState('')

  // Homepage Content State
  const [formData, setFormData] = useState(DEFAULT_CONTENT)
  const [loadingContent, setLoadingContent] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('')

  // Catalog items for feature picker
  const [catalogProducts, setCatalogProducts] = useState([])
  const [catalogTutorials, setCatalogTutorials] = useState([])
  const [catalogJournals, setCatalogJournals] = useState([])

  const notify = (msg, type = 'success') => {
    if (toast?.success && type === 'success') toast.success(msg)
    else if (toast?.error && type === 'error') toast.error(msg)
    else if (toast?.push) toast.push(msg, type)
    else if (toast?.showToast) toast.showToast(msg, type)
  }

  const loadImages = async () => {
    try {
      const rows = await fetchHeroImages()
      setImages(rows.filter((i) => i.side === 'LEFT' || !i.side))
    } catch (err) {
      console.error(err)
    }
  }

  const loadContent = async () => {
    setLoadingContent(true)
    try {
      const [data, prods, tuts, journals] = await Promise.all([
        fetchHomeContent(),
        fetchProducts().catch(() => []),
        fetchTutorials().catch(() => []),
        fetchJournals().catch(() => [])
      ])

      setCatalogProducts(prods || [])
      setCatalogTutorials(tuts || [])
      setCatalogJournals(journals || [])

      if (data) {
        let pIds = []
        let tIds = []
        let jIds = []
        try {
          pIds = typeof data.featuredProductIds === 'string' ? JSON.parse(data.featuredProductIds) : (data.featuredProductIds || [])
        } catch { pIds = [] }
        try {
          tIds = typeof data.featuredTutorialIds === 'string' ? JSON.parse(data.featuredTutorialIds) : (data.featuredTutorialIds || [])
        } catch { tIds = [] }
        try {
          jIds = typeof data.featuredJournalIds === 'string' ? JSON.parse(data.featuredJournalIds) : (data.featuredJournalIds || [])
        } catch { jIds = [] }

        setFormData((prev) => ({
          ...prev,
          ...data,
          featuredProductIds: Array.isArray(pIds) ? pIds : [],
          featuredTutorialIds: Array.isArray(tIds) ? tIds : [],
          featuredJournalIds: Array.isArray(jIds) ? jIds : []
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingContent(false)
    }
  }

  useEffect(() => {
    loadImages()
    loadContent()
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setImageError('')
    try {
      await uploadHeroImage(file, 'LEFT')
      await loadImages()
      notify('Hero image uploaded successfully!', 'success')
    } catch {
      setImageError('Upload failed. Is the backend server running?')
      notify('Upload failed. Try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this photo from the homepage orbit slideshow?')) return
    try {
      await deleteHeroImage(id)
      setImages((prev) => prev.filter((i) => i.id !== id))
      notify('Hero image deleted', 'success')
    } catch {
      notify('Failed to delete image.', 'error')
    }
  }

  const handleContentChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveContent = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccessMessage('')
    try {
      await updateHomeContent(formData)
      const successText = activeTab === 'featured'
        ? 'Featured products, tutorials, and journal selections saved successfully!'
        : 'Home page updated successfully!'
      notify(successText, 'success')
      setSaveSuccessMessage(successText)
      setTimeout(() => {
        setSaveSuccessMessage('')
      }, 5000)
    } catch (err) {
      console.error(err)
      notify('Failed to save home page updates.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefault = () => {
    if (window.confirm('Reset all text fields back to default website copy?')) {
      setFormData(DEFAULT_CONTENT)
    }
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 24,
          marginBottom: 32,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 28, color: 'var(--color-text)', marginBottom: 8 }}>
            Home Page & Hero Studio
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, maxWidth: 620, lineHeight: 1.5 }}>
            Customize the homepage of your website — manage rotating orbit photos, hero headlines, promotional copy, call-to-action buttons, and WhatsApp contact messages in real time.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            color: 'var(--color-text)',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          <Eye size={16} /> Live Preview
        </a>
      </div>

      {/* Visual Save Confirmation Alert */}
      {saveSuccessMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '14px 20px',
            borderRadius: 12,
            marginBottom: 24,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
          }}
        >
          <CheckCircle2 size={20} color="#10B981" />
          <span style={{ flex: 1 }}>{saveSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setSaveSuccessMessage('')}
            style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 32
        }}
      >
        {[
          { id: 'hero-orbit', label: '1. Orbit Hero Photos', icon: <ImagePlus size={16} /> },
          { id: 'hero-text', label: '2. Hero Headline & Subtitle', icon: <Sparkles size={16} /> },
          { id: 'sections', label: '3. Promo Bands & WhatsApp', icon: <LayoutTemplate size={16} /> },
          { id: 'featured', label: '4. Featured on Home', icon: <Star size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-brand)' : '2px solid transparent',
              background: 'none',
              color: activeTab === tab.id ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: -1
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Hero Orbit Photos */}
      {activeTab === 'hero-orbit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>
                  Rotating Orbit Photo Showcase
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  These craft photos orbit gently in the circular frame on the homepage hero, cycling automatically.
                </p>
              </div>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: 'var(--color-brand)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: uploading ? 'wait' : 'pointer',
                  opacity: uploading ? 0.7 : 1
                }}
              >
                {uploading ? <Upload size={18} className="spin" /> : <ImagePlus size={18} />}
                {uploading ? 'Uploading…' : 'Upload Orbit Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {imageError && (
              <p style={{ color: '#c94d5c', marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
                {imageError}
              </p>
            )}

            {images.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '2px dashed var(--color-border)',
                  backgroundColor: '#FAF7FC'
                }}
              >
                <ImagePlus size={36} color="var(--color-text-secondary)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>
                  No custom hero images uploaded yet
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                  The homepage is currently displaying default product photography (/crochet_tote.jpg, /amigurumi_bear.jpg, /hero-image.jpg).
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 20
                }}
              >
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: 12,
                      borderRadius: 14,
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#FAF7FC'
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid white',
                        boxShadow: '0 8px 20px rgba(90,70,120,0.15)',
                        background: '#F3EDF8'
                      }}
                    >
                      <img
                        src={img.imageUrl}
                        alt="Hero preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDelete(img.id)}
                        title="Delete photo"
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(255,255,255,0.95)',
                          color: '#c94d5c',
                          cursor: 'pointer',
                          display: 'grid',
                          placeItems: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Slide #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Hero Headline & CTA Buttons */}
      {activeTab === 'hero-text' && (
        <form onSubmit={handleSaveContent}>
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 24
            }}
          >
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>
                Hero Banner Headline & Subtitle
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                Change the main headline text, colorful accent words, and description that visitors see in the hero section.
              </p>
            </div>

            {/* Headline and Span Highlight */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
                  Main Title Headline
                </label>
                <input
                  type="text"
                  required
                  value={formData.heroTitle}
                  onChange={(e) => handleContentChange('heroTitle', e.target.value)}
                  placeholder="Enter main headline"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    fontSize: 14,
                    outline: 'none',
                    backgroundColor: '#FAF7FC'
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                  Full headline shown prominently on the left side of the hero.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
                  Accent Highlight Words (Gradient Span)
                </label>
                <input
                  type="text"
                  value={formData.heroTitleSpan}
                  onChange={(e) => handleContentChange('heroTitleSpan', e.target.value)}
                  placeholder="Enter highlight text"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    fontSize: 14,
                    outline: 'none',
                    backgroundColor: '#FAF7FC'
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                  Text within the headline that receives the vibrant brand magenta highlight styling.
                </span>
              </div>
            </div>

            {/* Hero Subtitle / Description */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
                Hero Subtitle Description
              </label>
              <textarea
                rows={3}
                required
                value={formData.heroDescription}
                onChange={(e) => handleContentChange('heroDescription', e.target.value)}
                placeholder="Enter hero description..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  fontSize: 14,
                  outline: 'none',
                  backgroundColor: '#FAF7FC',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={handleResetToDefault}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'white',
                  color: 'var(--color-text-secondary)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} /> Reset Default
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--color-brand)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Save size={16} /> {saving ? 'Saving Changes…' : 'Save Homepage Updates'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Custom Orders Band & Closing Section */}
      {activeTab === 'sections' && (
        <form onSubmit={handleSaveContent}>
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 28
            }}
          >
            {/* Custom Orders Banner */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <LayoutTemplate size={18} color="var(--color-brand)" />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  Custom Order Feature Banner
                </h3>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                The prominent colored showcase band positioned below the tutorial grid on the home page.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                    Banner Heading
                  </label>
                  <input
                    type="text"
                    value={formData.customTitle}
                    onChange={(e) => handleContentChange('customTitle', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, backgroundColor: '#FAF7FC' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                    Button Call-To-Action Text
                  </label>
                  <input
                    type="text"
                    value={formData.customBtnText}
                    onChange={(e) => handleContentChange('customBtnText', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, backgroundColor: '#FAF7FC' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  Banner Description
                </label>
                <textarea
                  rows={2}
                  value={formData.customDesc}
                  onChange={(e) => handleContentChange('customDesc', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, backgroundColor: '#FAF7FC', lineHeight: 1.4 }}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Closing Footer Banner */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <CheckCircle2 size={18} color="var(--color-brand)" />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  Bottom Invitation Banner (Closing CTA)
                </h3>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                The warm closing invitation banner above the website footer.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                    Closing Title
                  </label>
                  <input
                    type="text"
                    value={formData.closingTitle}
                    onChange={(e) => handleContentChange('closingTitle', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, backgroundColor: '#FAF7FC' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                    Closing Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.closingDesc}
                    onChange={(e) => handleContentChange('closingDesc', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, backgroundColor: '#FAF7FC' }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={handleResetToDefault}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'white',
                  color: 'var(--color-text-secondary)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} /> Reset Default
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--color-brand)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Save size={16} /> {saving ? 'Saving Changes…' : 'Save Homepage Updates'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Featured Content Picker (Products, Tutorials, Journals) */}
      {activeTab === 'featured' && (
        <form onSubmit={handleSaveContent} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          

          {/* 1. Featured Products */}
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FAF7FC', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
                    Featured Products ("From the shop")
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Selected: {formData.featuredProductIds?.length || 0} (Recommended: 4 items)
                  </p>
                </div>
              </div>
              {formData.featuredProductIds?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, featuredProductIds: [] }))}
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {catalogProducts.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontStyle: 'italic', margin: 0 }}>
                No products found in the catalog. Add products in the Products tab first.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {catalogProducts.map((prod) => {
                  const isSelected = formData.featuredProductIds?.some(id => String(id) === String(prod.id))
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setFormData(prev => {
                          const current = prev.featuredProductIds || []
                          const exists = current.some(id => String(id) === String(prod.id))
                          const updated = exists
                            ? current.filter(id => String(id) !== String(prod.id))
                            : [...current, prod.id]
                          return { ...prev, featuredProductIds: updated }
                        })
                      }}
                      style={{
                        border: isSelected ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? '#FAF5FF' : 'white',
                        borderRadius: 12,
                        padding: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FAF7FC' }}>
                        <img
                          src={prod.image || '/hero-image.jpg'}
                          alt={prod.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = '/hero-image.jpg' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: isSelected ? 'var(--color-brand)' : 'rgba(255,255,255,0.85)',
                            color: isSelected ? 'white' : '#A0AEC0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <Check size={14} strokeWidth={isSelected ? 3 : 2} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 2 }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-brand)', fontWeight: 600 }}>
                          Rs {prod.price}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 2. Featured Tutorials */}
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FAF7FC', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
                    Featured Tutorials ("Learn with us")
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Selected: {formData.featuredTutorialIds?.length || 0} (Recommended: 3 items)
                  </p>
                </div>
              </div>
              {formData.featuredTutorialIds?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, featuredTutorialIds: [] }))}
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {catalogTutorials.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontStyle: 'italic', margin: 0 }}>
                No tutorials found in catalog.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {catalogTutorials.map((tut) => {
                  const isSelected = formData.featuredTutorialIds?.some(id => String(id) === String(tut.id))
                  return (
                    <div
                      key={tut.id}
                      onClick={() => {
                        setFormData(prev => {
                          const current = prev.featuredTutorialIds || []
                          const exists = current.some(id => String(id) === String(tut.id))
                          const updated = exists
                            ? current.filter(id => String(id) !== String(tut.id))
                            : [...current, tut.id]
                          return { ...prev, featuredTutorialIds: updated }
                        })
                      }}
                      style={{
                        border: isSelected ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? '#FAF5FF' : 'white',
                        borderRadius: 12,
                        padding: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FAF7FC' }}>
                        <img
                          src={tut.thumbnail || tut.image || '/crochet_tote.jpg'}
                          alt={tut.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = '/crochet_tote.jpg' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: isSelected ? 'var(--color-brand)' : 'rgba(255,255,255,0.85)',
                            color: isSelected ? 'white' : '#A0AEC0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <Check size={14} strokeWidth={isSelected ? 3 : 2} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 2 }}>
                          {tut.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {tut.duration ? `${tut.duration} mins` : (tut.category || 'Tutorial')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. Featured Journal Articles */}
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FAF7FC', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
                    Featured Journal Articles ("From the journal")
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Selected: {formData.featuredJournalIds?.length || 0} (Recommended: 3 items)
                  </p>
                </div>
              </div>
              {formData.featuredJournalIds?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, featuredJournalIds: [] }))}
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {catalogJournals.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontStyle: 'italic', margin: 0 }}>
                No journal articles found. Add journal posts in the Journal tab first.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {catalogJournals.map((jrnl) => {
                  const isSelected = formData.featuredJournalIds?.some(id => String(id) === String(jrnl.id))
                  return (
                    <div
                      key={jrnl.id}
                      onClick={() => {
                        setFormData(prev => {
                          const current = prev.featuredJournalIds || []
                          const exists = current.some(id => String(id) === String(jrnl.id))
                          const updated = exists
                            ? current.filter(id => String(id) !== String(jrnl.id))
                            : [...current, jrnl.id]
                          return { ...prev, featuredJournalIds: updated }
                        })
                      }}
                      style={{
                        border: isSelected ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? '#FAF5FF' : 'white',
                        borderRadius: 12,
                        padding: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FAF7FC' }}>
                        <img
                          src={jrnl.image || '/amigurumi_bear.jpg'}
                          alt={jrnl.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = '/amigurumi_bear.jpg' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: isSelected ? 'var(--color-brand)' : 'rgba(255,255,255,0.85)',
                            color: isSelected ? 'white' : '#A0AEC0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <Check size={14} strokeWidth={isSelected ? 3 : 2} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 2 }}>
                          {jrnl.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {jrnl.readTime || 'Story'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Save Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              padding: 20,
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 16
            }}
          >
            <div>
              {saveSuccessMessage ? (
                <span style={{ color: '#059669', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Saved! Your selections are live on the homepage.
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                  Click to publish your featured choices live to the homepage.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--color-brand)',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
              }}
            >
              <Save size={16} /> {saving ? 'Saving Choices…' : 'Save Featured Content Selections'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
