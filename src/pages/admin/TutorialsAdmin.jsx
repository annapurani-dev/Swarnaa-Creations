import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Play,
  X,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { fetchTutorials, createTutorial, updateTutorial, deleteTutorial, fetchCategories } from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCategoryLabel } from '../../lib/categories'
import { onCategoriesChanged } from '../../lib/categorySync'
import { useToast } from '../../context/ToastContext'

export default function TutorialsAdmin() {
  const toast = useToast()
  const [tutorials, setTutorials] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [catsLoading, setCatsLoading] = useState(false)
  const [catsError, setCatsError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTutorial, setEditingTutorial] = useState(null)
  const [saving, setSaving] = useState(false)

  // Tutorial form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [level, setLevel] = useState('Beginner')
  const [type, setType] = useState('Video')
  const [duration, setDuration] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  // Multi-image list: array of objects { id, url, file, isExisting }
  const [imageList, setImageList] = useState([])
  const [primaryIndex, setPrimaryIndex] = useState(0)

  const loadCategories = async () => {
    setCatsLoading(true)
    setCatsError('')
    try {
      const cats = (await fetchCategories('TUTORIAL')).filter(
        (c) => String(c.type || '').toUpperCase() === 'TUTORIAL',
      )
      setCategories(cats)
      if (!cats.length) setCatsError('No tutorial categories yet. Add them under Categories → Tutorial.')
      return cats
    } catch (err) {
      setCategories([])
      setCatsError(err.message || 'Could not load categories.')
      return []
    } finally {
      setCatsLoading(false)
    }
  }

  const loadData = async () => {
    const [tuts] = await Promise.all([fetchTutorials(), loadCategories()])
    setTutorials(tuts)
  }

  useEffect(() => {
    loadData()
    return onCategoriesChanged((detail) => {
      if (!detail?.type || String(detail.type).toUpperCase() === 'TUTORIAL') {
        loadCategories()
      }
    })
  }, [])

  const handleOpenModal = async (tutorial = null) => {
    setEditingTutorial(tutorial)

    if (tutorial) {
      setTitle(tutorial.title || '')
      setDescription(tutorial.description || '')
      setPrice(String(tutorial.price ?? 0))
      setLevel(tutorial.level || 'Beginner')
      setType(tutorial.type || 'Video')
      setDuration(tutorial.duration || '')
      setVideoUrl(tutorial.videoUrl || '')
      setCategoryId(tutorial.categoryId ? String(tutorial.categoryId) : '')

      // Existing images
      let existingUrls = []
      if (Array.isArray(tutorial.materials) && tutorial.materials.length > 0) {
        existingUrls = tutorial.materials.filter((m) => typeof m === 'string' && (m.startsWith('/') || m.startsWith('http')))
      }
      if (existingUrls.length === 0 && tutorial.image) {
        existingUrls = [tutorial.image]
      }

      const initialList = existingUrls.map((url, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        url,
        file: null,
        isExisting: true
      }))

      setImageList(initialList)
      const foundIdx = initialList.findIndex(item => item.url === tutorial.image)
      setPrimaryIndex(foundIdx >= 0 ? foundIdx : 0)
    } else {
      setTitle('')
      setDescription('')
      setPrice('0')
      setLevel('Beginner')
      setType('Video')
      setDuration('')
      setVideoUrl('')
      setCategoryId('')
      setImageList([])
      setPrimaryIndex(0)
    }

    setIsModalOpen(true)
    const cats = await loadCategories()
    if (tutorial?.categoryId && cats.some((c) => String(c.id) === String(tutorial.categoryId))) {
      setCategoryId(String(tutorial.categoryId))
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTutorial(null)
    setCategoryId('')
    setImageList([])
    setPrimaryIndex(0)
  }

  const handleAddImageFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const newEntries = files.map((file, idx) => ({
      id: `new-${Date.now()}-${idx}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
      isExisting: false
    }))

    setImageList((prev) => {
      const nextList = [...prev, ...newEntries]
      if (prev.length === 0 && nextList.length > 0) {
        setPrimaryIndex(0)
      }
      return nextList
    })
    e.target.value = ''
  }

  const handleRemoveImage = (indexToRemove) => {
    setImageList((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove)
      if (primaryIndex === indexToRemove) {
        setPrimaryIndex(0)
      } else if (primaryIndex > indexToRemove) {
        setPrimaryIndex(primaryIndex - 1)
      }
      return next
    })
  }

  const handleSaveTutorial = async (e) => {
    e.preventDefault()
    if (!categoryId) {
      toast.error('Please choose a tutorial category.')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('categoryId', categoryId)
      formData.append('price', price)
      formData.append('description', description)
      formData.append('level', level)
      formData.append('type', type)
      formData.append('duration', duration)
      formData.append('videoUrl', videoUrl)

      const existingKept = imageList
        .filter((item) => item.isExisting)
        .map((item) => item.url)
      formData.append('existingImages', JSON.stringify(existingKept))

      imageList.forEach((item) => {
        if (item.file) {
          formData.append('imageFiles', item.file)
        }
      })

      formData.append('primaryIndex', String(primaryIndex))

      if (editingTutorial) {
        await updateTutorial(editingTutorial.id, formData)
        toast.success(`Updated "${title}" successfully.`)
      } else {
        await createTutorial(formData)
        toast.success(`Created "${title}" successfully.`)
      }

      handleCloseModal()
      loadData()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to save tutorial.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tutorial?')) {
      try {
        await deleteTutorial(id)
        setTutorials(tutorials.filter((t) => t.id !== id))
        toast.success('Tutorial deleted.')
      } catch (err) {
        toast.error('Failed to delete tutorial.')
      }
    }
  }

  const filteredTutorials = tutorials.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>
            Workshops & Tutorials
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Manage video masterclasses, pattern guides, and creative learning modules.
            {categories.length > 0 && (
              <span style={{ marginLeft: 8 }}>
                · {categories.length} tutorial categor{categories.length === 1 ? 'y' : 'ies'} loaded
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              color="var(--color-text-secondary)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                outline: 'none',
                width: '240px',
                backgroundColor: 'white'
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            style={{
              backgroundColor: 'var(--color-brand)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(226,1,113,0.2)'
            }}
          >
            <Plus size={18} /> Add Tutorial
          </button>
        </div>
      </div>

      {/* Tutorials Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px 24px', width: '70px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Thumbnail</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Tutorial Title</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Type / Level</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Price</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTutorials.map((tut, i) => (
                <tr
                  key={tut.id}
                  style={{
                    borderBottom: i === filteredTutorials.length - 1 ? 'none' : '1px solid var(--color-border)',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: '#FAF7FC' }}>
                      <img src={tut.image || '/crochet_tote.jpg'} alt={tut.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
                      {tut.title}
                    </div>
                    {tut.description && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tut.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '50px', backgroundColor: '#F3EDF8', color: 'var(--color-brand)', fontSize: '12px', fontWeight: 600 }}>
                      {tut.category || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{tut.type}</span> · {tut.level}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '15px', fontWeight: 700, color: tut.isFree || tut.price === 0 ? '#2E7D32' : 'var(--color-brand)', whiteSpace: 'nowrap' }}>
                    {tut.isFree || tut.price === 0 ? 'Free' : `Rs ${tut.price}`}
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Link
                        to={`/tutorial/${tut.id}`}
                        target="_blank"
                        title="View Live Tutorial Page"
                        style={{ color: 'var(--color-text-secondary)', padding: '6px', borderRadius: '6px' }}
                      >
                        <ExternalLink size={17} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(tut)}
                        title="Edit Tutorial"
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                      >
                        <Edit size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tut.id)}
                        title="Delete Tutorial"
                        style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTutorials.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No tutorials found matching &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>

      {/* Clean Add/Edit Tutorial Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              padding: '24px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
                padding: '32px'
              }}
            >
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <X size={22} />
              </button>

              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)', margin: '0 0 6px' }}>
                  {editingTutorial ? 'Edit Tutorial' : 'Add New Tutorial'}
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Fill in the details for this workshop.
                </p>
              </div>

              <form onSubmit={handleSaveTutorial} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Title & Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Tutorial Title
                    </label>
                    <input
                      required
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter Tutorial Title"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label htmlFor="tutorial-category" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                        Category
                      </label>
                      <button
                        type="button"
                        onClick={loadCategories}
                        disabled={catsLoading}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: 'var(--color-brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <RefreshCw size={11} className={catsLoading ? 'spin' : ''} /> Refresh
                      </button>
                    </div>
                    <select
                      id="tutorial-category"
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={categories.length === 0 && catsLoading}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    >
                      <option value="">
                        {catsLoading ? 'Loading…' : categories.length ? 'Select category' : 'No categories available'}
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {formatCategoryLabel(c.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                    Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter Tutorial Description"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px',
                      outline: 'none',
                      lineHeight: 1.5,
                      backgroundColor: '#FAF7FC',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Level & Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Skill Level
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Format
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    >
                      <option value="Video">Video</option>
                      <option value="Text Guide">Text Guide</option>
                    </select>
                  </div>
                </div>

                {/* Pricing & Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Price (Rs)
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter Price in Rs (0 for Free)"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Estimated Duration
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Enter Duration (e.g. 45 mins)"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    />
                  </div>
                </div>

                {/* Video Link */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                    Video URL (YouTube / Vimeo / Cloud link)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Enter Video Link URL"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                  />
                </div>

                {/* Multi-Photo Upload & Primary Image Selector */}
                <div style={{ backgroundColor: '#F8F9FA', padding: '20px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 2px' }}>
                        Tutorial Images & Materials
                      </label>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Add multiple photos and click any image to set it as Primary.
                      </span>
                    </div>

                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-brand)',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={15} /> Add Images
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleAddImageFiles}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {imageList.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', border: '2px dashed var(--color-border)', borderRadius: '10px', backgroundColor: '#FAF7FC' }}>
                      <ImageIcon size={32} color="var(--color-text-secondary)" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        No images selected. Click &quot;Add Images&quot; to choose one or more tutorial photos.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '14px', marginTop: '12px' }}>
                      {imageList.map((img, idx) => {
                        const isPrimary = primaryIndex === idx
                        return (
                          <div
                            key={img.id}
                            onClick={() => setPrimaryIndex(idx)}
                            style={{
                              position: 'relative',
                              borderRadius: '12px',
                              padding: '8px',
                              cursor: 'pointer',
                              border: isPrimary ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                              backgroundColor: isPrimary ? 'var(--color-lavender-light)' : 'white',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease',
                              boxShadow: isPrimary ? '0 4px 12px rgba(226,1,113,0.15)' : 'none'
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveImage(idx)
                              }}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10
                              }}
                              title="Remove photo"
                            >
                              <X size={13} />
                            </button>

                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', backgroundColor: '#FAF7FC' }}>
                              <img src={img.url} alt={`Tutorial ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '50px',
                                backgroundColor: isPrimary ? 'var(--color-brand)' : '#F3EDF8',
                                color: isPrimary ? 'white' : 'var(--color-text-secondary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              {isPrimary ? (
                                <>
                                  <CheckCircle2 size={11} /> Primary
                                </>
                              ) : (
                                'Set Primary'
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      padding: '11px 22px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'white',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '11px 28px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: 'var(--color-brand)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: saving ? 'wait' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      boxShadow: '0 4px 12px rgba(226,1,113,0.25)'
                    }}
                  >
                    {saving ? 'Saving…' : editingTutorial ? 'Update Tutorial' : 'Create Tutorial'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
