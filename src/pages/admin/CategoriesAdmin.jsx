import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchCategories, createCategory, deleteCategory } from '../../api'
import { notifyCategoriesChanged } from '../../lib/categorySync'
import { useToast } from '../../context/ToastContext'

export default function CategoriesAdmin() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    const data = await fetchCategories()
    setCategories(data)
    setLoading(false)
  }

  const [filters, setFilters] = useState([
    { id: 1, title: 'Material', type: 'Checkbox', details: 'Cotton, Resin, Paper' },
    { id: 2, title: 'Price Range', type: 'Range', details: 'Min: 0, Max: 10000' },
    { id: 3, title: 'Best Seller', type: 'Yes/No', details: '-' },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingFilter, setEditingFilter] = useState(null)
  const [activeTab, setActiveTab] = useState('PRODUCT')
  const [filterTypeForm, setFilterTypeForm] = useState('Checkbox')

  const handleOpenModal = (cat = null) => {
    setEditingCategory(cat)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    if (editingCategory) {
      // Future: PUT request
      toast.info('Edit not implemented on backend yet!')
    } else {
      try {
        const type = formData.get('type')
        await createCategory(formData.get('name'), type)
        await loadCategories()
        notifyCategoriesChanged({ type })
        toast.success('Category saved.')
      } catch (err) {
        toast.error(err.message || 'Failed to save category.')
      }
    }
    handleCloseModal()
  }

  const handleDelete = async (id) => {
    const cat = categories.find((c) => c.id === id)
    const label = cat?.name || 'this category'
    if (!window.confirm(`Delete “${label}” (${cat?.type || 'category'})?\n\nThis updates Add Product / Add Tutorial dropdowns immediately.`)) {
      return
    }
    try {
      await deleteCategory(id)
      await loadCategories()
      notifyCategoriesChanged({ type: cat?.type })
      toast.success('Category deleted.')
    } catch (err) {
      const msg = err.message || 'Failed to delete category.'
      const force = window.confirm(
        `${msg}\n\nForce delete anyway? Linked items will be moved to another ${cat?.type === 'TUTORIAL' ? 'tutorial' : 'product'} category.`,
      )
      if (!force) return
      try {
        await deleteCategory(id, { force: true })
        await loadCategories()
        notifyCategoriesChanged({ type: cat?.type })
        toast.success('Category force-deleted. Linked items were reassigned.')
      } catch (err2) {
        toast.error(err2.message || 'Failed to force-delete category.')
        await loadCategories()
      }
    }
  }

  const handleOpenFilterModal = (filter = null) => {
    setEditingFilter(filter)
    setFilterTypeForm(filter?.type || 'Checkbox')
    setIsFilterModalOpen(true)
  }

  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false)
    setEditingFilter(null)
  }

  const handleSaveFilter = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const type = formData.get('type')
    
    let details = '-'
    if (type === 'Checkbox') {
      details = formData.get('checkboxOptions')
    } else if (type === 'Range') {
      details = `Min: ${formData.get('min')}, Max: ${formData.get('max')}`
    }

    const newFilter = {
      id: editingFilter ? editingFilter.id : Date.now(),
      title: formData.get('title'),
      type: type,
      details: details
    }

    if (editingFilter) {
      setFilters(filters.map(f => f.id === editingFilter.id ? newFilter : f))
    } else {
      setFilters([...filters, newFilter])
    }
    handleCloseFilterModal()
  }

  const handleDeleteFilter = (id) => {
    if(window.confirm('Are you sure you want to delete this filter?')) {
      setFilters(filters.filter(f => f.id !== id))
    }
  }

  const filteredCategories = categories.filter((c) => {
    if (activeTab === 'Filter') return false
    return String(c.type || '').toUpperCase() === activeTab
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>Categories & Filters</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>Manage classification tags and shop filters.</p>
        </div>
        {activeTab !== 'Filter' ? (
          <button onClick={() => handleOpenModal()} style={{ backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Category
          </button>
        ) : (
          <button onClick={() => handleOpenFilterModal()} style={{ backgroundColor: 'var(--color-brand)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Filter
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('PRODUCT')}
          style={{ padding: '8px 24px', borderRadius: '50px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: activeTab === 'PRODUCT' ? 'var(--color-text)' : '#E9ECEF', color: activeTab === 'PRODUCT' ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}
        >
          Product Categories
        </button>
        <button 
          onClick={() => setActiveTab('TUTORIAL')}
          style={{ padding: '8px 24px', borderRadius: '50px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: activeTab === 'TUTORIAL' ? 'var(--color-text)' : '#E9ECEF', color: activeTab === 'TUTORIAL' ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}
        >
          Tutorial Categories
        </button>
        <button 
          onClick={() => setActiveTab('Filter')}
          style={{ padding: '8px 24px', borderRadius: '50px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: activeTab === 'Filter' ? 'var(--color-text)' : '#E9ECEF', color: activeTab === 'Filter' ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}
        >
          Custom Filters
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        {activeTab !== 'Filter' ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', width: '40px' }}></th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Category Name</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Type</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Items Linked</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat, i) => (
              <tr key={cat.id} style={{ borderBottom: i === filteredCategories.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px' }}><Tag size={18} color="var(--color-text-secondary)" /></td>
                <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>{cat.name}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{cat.type}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ backgroundColor: 'var(--color-lavender-light)', padding: '4px 12px', borderRadius: '50px', color: 'var(--color-brand)', fontWeight: 600 }}>
                    {cat.count} items
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenModal(cat)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Filter Title</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Type</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Details / Options</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filters.map((filter, i) => (
              <tr key={filter.id} style={{ borderBottom: i === filters.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>{filter.title}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ backgroundColor: '#F1F3F5', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{filter.type}</span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{filter.details}</td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenFilterModal(filter)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteFilter(filter.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        
        {activeTab !== 'Filter' && filteredCategories.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No {activeTab === 'PRODUCT' ? 'product' : 'tutorial'} categories found.
          </div>
        )}
        {activeTab === 'Filter' && filters.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No custom filters found.
          </div>
        )}
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <button onClick={handleCloseModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={24} /></button>
              
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)', marginBottom: '24px' }}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Category Name</label>
                  <input required name="name" defaultValue={editingCategory?.name || ''} type="text" placeholder="e.g., Resin Art" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Applies To</label>
                  <select
                    required
                    name="type"
                    defaultValue={
                      editingCategory?.type === 'TUTORIAL' || editingCategory?.type === 'Tutorial'
                        ? 'TUTORIAL'
                        : activeTab === 'TUTORIAL'
                          ? 'TUTORIAL'
                          : 'PRODUCT'
                    }
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', backgroundColor: 'white' }}
                  >
                    <option value="PRODUCT">Products (Shop)</option>
                    <option value="TUTORIAL">Tutorials (Learning Hub)</option>
                  </select>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <button onClick={handleCloseFilterModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={24} /></button>
              
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)', marginBottom: '24px' }}>
                {editingFilter ? 'Edit Filter' : 'Add New Filter'}
              </h2>
              
              <form onSubmit={handleSaveFilter} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Filter Title</label>
                  <input required name="title" defaultValue={editingFilter?.title || ''} type="text" placeholder="e.g., Size, Material, Price" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Filter Type</label>
                  <select required name="type" value={filterTypeForm} onChange={(e) => setFilterTypeForm(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px', backgroundColor: 'white' }}>
                    <option value="Checkbox">Checkbox (Multiple Choice)</option>
                    <option value="Yes/No">Yes/No (Toggle)</option>
                    <option value="Range">Number Range</option>
                  </select>
                </div>

                {filterTypeForm === 'Checkbox' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Options (Comma separated)</label>
                    <input required name="checkboxOptions" defaultValue={editingFilter?.details && filterTypeForm === editingFilter?.type ? editingFilter.details : ''} type="text" placeholder="e.g., Red, Blue, Green" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                  </div>
                )}

                {filterTypeForm === 'Range' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Min Value</label>
                      <input required name="min" type="number" defaultValue={0} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Max Value</label>
                      <input required name="max" type="number" defaultValue={100} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                    </div>
                  </div>
                )}

                {filterTypeForm === 'Yes/No' && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    A simple toggle switch will be rendered for this filter.
                  </div>
                )}

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={handleCloseFilterModal} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save Filter</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
