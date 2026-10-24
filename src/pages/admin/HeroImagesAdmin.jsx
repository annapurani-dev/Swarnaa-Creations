import { useEffect, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { deleteHeroImage, fetchHeroImages, uploadHeroImage } from '../../api'
import { useToast } from '../../context/ToastContext'

export default function HeroImagesAdmin() {
  const toast = useToast()
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const rows = await fetchHeroImages()
    setImages(rows.filter((i) => i.side === 'LEFT' || !i.side))
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await uploadHeroImage(file, 'LEFT')
      await load()
    } catch {
      setError('Upload failed. Is the backend running?')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this hero image?')) return
    try {
      await deleteHeroImage(id)
      setImages((prev) => prev.filter((i) => i.id !== id))
    } catch {
      toast.error('Failed to delete image.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 28, marginBottom: 8 }}>Hero Images</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, maxWidth: 480 }}>
            Upload photos for the large circular slideshow on the homepage hero. They cycle one after another.
          </p>
        </div>

        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--color-brand)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? <Upload size={18} /> : <ImagePlus size={18} />}
          {uploading ? 'Uploading…' : 'Upload image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {error && (
        <p style={{ color: '#c94d5c', marginBottom: 16, fontSize: 14 }}>{error}</p>
      )}

      <div
        style={{
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}
      >
        {images.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
            No images yet — homepage will use defaults.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20 }}>
            {images.map((img) => (
              <div
                key={img.id}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid white',
                  boxShadow: '0 8px 24px rgba(90,70,120,0.15)',
                  background: '#F3EDF8',
                }}
              >
                <img src={img.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  title="Delete"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#c94d5c',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
