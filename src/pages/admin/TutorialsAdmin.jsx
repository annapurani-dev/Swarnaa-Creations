import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Edit, Trash2, Plus, Play, X, RefreshCw } from 'lucide-react'
import { fetchTutorials, createTutorial, deleteTutorial, fetchCategories } from '../../api'
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

  const loadCategories = async () => {
    setCatsLoading(true)
    setCatsError('')
    try {
      // Only tutorial categories — never product shop categories
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
    setCategoryId(tutorial?.categoryId ? String(tutorial.categoryId) : '')
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
  }

  const handleSaveTutorial = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    if (editingTutorial) {
      toast.info('Edit not implemented on backend yet!')
      handleCloseModal()
      return
    }

    if (!categoryId) {
      toast.error('Choose a category.')
      return
    }

    try {
      await createTutorial({
        title: formData.get('title'),
        categoryId: Number(categoryId),
        price: Number(formData.get('price')),
        isFree: Number(formData.get('price')) === 0,
        description: formData.get('description') || 'No description provided.',
        level: formData.get('level'),
        type: formData.get('type'),
      })
      toast.success('Tutorial created.')
      handleCloseModal()
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to create tutorial.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tutorial?')) {
      try {
        await deleteTutorial(id)
        setTutorials(tutorials.filter((t) => t.id !== id))
      } catch (err) {
        toast.error('Failed to delete tutorial.')
      }
    }
  }

  const filteredTutorials = tutorials.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>Learning Hub Admin</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Manage video and text tutorials.
            {categories.length > 0 && (
              <span style={{ marginLeft: 8 }}>
                · {categories.length} tutorial categor{categories.length === 1 ? 'y' : 'ies'} loaded
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', width: '240px' }}
            />
          </div>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            style={{ backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> New Tutorial
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Tutorial Title</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Price</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTutorials.map((tut, i) => (
              <tr key={tut.id} style={{ borderBottom: i === filteredTutorials.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Play size={14} /> {tut.title}
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{tut.category}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                  {tut.isFree || tut.price === 0 ? 'Free' : `₹${tut.price}`}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => handleOpenModal(tut)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Edit size={18} />
                    </button>
                    <button type="button" onClick={() => handleDelete(tut.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTutorials.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No tutorials found matching &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <button type="button" onClick={handleCloseModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={24} /></button>

              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)', marginBottom: '24px' }}>
                {editingTutorial ? 'Edit Tutorial' : 'Add New Tutorial'}
              </h2>

              <form onSubmit={handleSaveTutorial} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Tutorial Title</label>
                  <input required name="title" defaultValue={editingTutorial?.title || ''} type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label htmlFor="tutorial-category" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Category * (from admin Categories)
                    </label>
                    <button
                      type="button"
                      onClick={loadCategories}
                      disabled={catsLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: 'var(--color-brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>
                  <select
                    id="tutorial-category"
                    name="categoryId"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={categories.length === 0 && catsLoading}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#F8F9FA' }}
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
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: catsError ? '#c94d5c' : 'var(--color-text-secondary)' }}>
                    {catsError ? (
                      <>
                        {catsError}{' '}
                        <Link to="/admin/categories" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>Add categories</Link>
                      </>
                    ) : (
                      categories.map((c) => formatCategoryLabel(c.name)).join(' · ') || '—'
                    )}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Level</label>
                    <select required name="level" defaultValue={editingTutorial?.level || 'Beginner'} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', backgroundColor: 'white' }}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Type</label>
                    <select required name="type" defaultValue={editingTutorial?.type || 'Video'} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', backgroundColor: 'white' }}>
                      <option value="Video">Video</option>
                      <option value="Text Guide">Text Guide</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Price (₹) - 0 for Free</label>
                  <input required name="price" defaultValue={editingTutorial?.price ?? ''} type="number" min="0" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Description</label>
                  <textarea name="description" defaultValue={editingTutorial?.description || ''} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', minHeight: '80px', fontFamily: 'inherit' }} />
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save Tutorial</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
