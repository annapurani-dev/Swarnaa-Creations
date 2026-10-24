import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Star,
  ExternalLink
} from 'lucide-react'
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCategories } from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCategoryLabel } from '../../lib/categories'
import { onCategoriesChanged } from '../../lib/categorySync'
import { useToast } from '../../context/ToastContext'

export default function ProductsAdmin() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [catsLoading, setCatsLoading] = useState(false)
  const [catsError, setCatsError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form inputs
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('15')

  // Multi-image list: array of objects { id, url, file, isExisting }
  const [imageList, setImageList] = useState([])
  const [primaryIndex, setPrimaryIndex] = useState(0)

  const loadCategories = async () => {
    setCatsLoading(true)
    setCatsError('')
    try {
      const cats = (await fetchCategories('PRODUCT')).filter(
        (c) => String(c.type || '').toUpperCase() === 'PRODUCT',
      )
      setCategories(cats)
      if (!cats.length) setCatsError('No product categories yet. Add them under Categories → Product.')
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
    const [prods] = await Promise.all([fetchProducts(), loadCategories()])
    setProducts(prods)
  }

  useEffect(() => {
    loadData()
    return onCategoriesChanged((detail) => {
      if (!detail?.type || String(detail.type).toUpperCase() === 'PRODUCT') {
        loadCategories()
      }
    })
  }, [])

  const handleOpenModal = async (product = null) => {
    setEditingProduct(product)

    if (product) {
      setName(product.name || '')
      setDescription(product.description || '')
      setPrice(String(product.price || ''))
      setStock(String(product.stock ?? 15))
      setCategoryId(product.categoryId ? String(product.categoryId) : '')

      // Existing images array
      const existingUrls = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.image ? [product.image] : [])

      const initialList = existingUrls.map((url, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        url,
        file: null,
        isExisting: true
      }))

      setImageList(initialList)

      // Find index of current primary image
      const foundIdx = initialList.findIndex(item => item.url === product.image)
      setPrimaryIndex(foundIdx >= 0 ? foundIdx : 0)
    } else {
      setName('')
      setDescription('')
      setPrice('')
      setStock('15')
      setCategoryId('')
      setImageList([])
      setPrimaryIndex(0)
    }

    setIsModalOpen(true)
    const cats = await loadCategories()
    if (product?.categoryId && cats.some((c) => String(c.id) === String(product.categoryId))) {
      setCategoryId(String(product.categoryId))
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setCategoryId('')
    setImageList([])
    setPrimaryIndex(0)
  }

  // Handle adding multiple image files
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
      // If was empty, automatically make first added image primary
      if (prev.length === 0 && nextList.length > 0) {
        setPrimaryIndex(0)
      }
      return nextList
    })

    // Reset input so user can choose same files again if needed
    e.target.value = ''
  }

  const handleRemoveImage = (indexToRemove) => {
    setImageList((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove)
      // Adjust primaryIndex if needed
      if (primaryIndex === indexToRemove) {
        setPrimaryIndex(0)
      } else if (primaryIndex > indexToRemove) {
        setPrimaryIndex(primaryIndex - 1)
      }
      return next
    })
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!categoryId) {
      toast.error('Please choose a product category.')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('categoryId', categoryId)
      formData.append('price', price)
      formData.append('stock', stock)
      formData.append('description', description)

      // Existing image URLs that were kept
      const existingKept = imageList
        .filter((item) => item.isExisting)
        .map((item) => item.url)
      formData.append('existingImages', JSON.stringify(existingKept))

      // New files attached
      imageList.forEach((item) => {
        if (item.file) {
          formData.append('imageFiles', item.file)
        }
      })

      formData.append('primaryIndex', String(primaryIndex))

      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
        toast.success(`Updated "${name}" successfully.`)
      } else {
        await createProduct(formData)
        toast.success(`Created "${name}" successfully.`)
      }

      handleCloseModal()
      loadData()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id)
        setProducts(products.filter((p) => p.id !== id))
        toast.success('Product deleted.')
      } catch (err) {
        toast.error('Failed to delete product.')
      }
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>
            Product Catalog
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Manage shop inventory, descriptions, and photos.
            {categories.length > 0 && (
              <span style={{ marginLeft: 8 }}>
                · {categories.length} product categor{categories.length === 1 ? 'y' : 'ies'} loaded
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
              placeholder="Search products..."
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
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px 24px', width: '70px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Image</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Product Name</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Price</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Stock</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, i) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: i === filteredProducts.length - 1 ? 'none' : '1px solid var(--color-border)',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: '#FAF7FC' }}>
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
                      {product.name}
                    </div>
                    {product.description && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '50px', backgroundColor: '#F3EDF8', color: 'var(--color-brand)', fontSize: '12px', fontWeight: 600 }}>
                      {product.category || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '15px', fontWeight: 700, color: 'var(--color-brand)', whiteSpace: 'nowrap' }}>
                    Rs {product.price}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: product.stock > 5 ? '#2E7D32' : '#e74c3c', fontWeight: 600 }}>
                    {product.stock || 0} units
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Link
                        to={`/shop/${product.id}`}
                        target="_blank"
                        title="View Live Product Page"
                        style={{ color: 'var(--color-text-secondary)', padding: '6px', borderRadius: '6px' }}
                      >
                        <ExternalLink size={17} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(product)}
                        title="Edit Product"
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                      >
                        <Edit size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        title="Delete Product"
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

        {filteredProducts.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No products found matching &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>

      {/* Clean Add/Edit Product Modal */}
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
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Fill in the details for this product.
                </p>
              </div>

              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Product Name & Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Product Title
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Product Name"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label htmlFor="product-category" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
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
                      id="product-category"
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
                    placeholder="Enter Product Description"
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

                {/* Pricing & Stock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Price (Rs)
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter Price in Rs"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Stock Quantity
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="Enter Stock Quantity"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', backgroundColor: '#FAF7FC' }}
                    />
                  </div>
                </div>

                {/* Multi-Photo Upload & Primary Image Selector */}
                <div style={{ backgroundColor: '#F8F9FA', padding: '20px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 2px' }}>
                        Product Photos
                      </label>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Add multiple images and click any photo to set it as Primary.
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
                        No images selected. Click &quot;Add Images&quot; to choose one or more product photos.
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
                            {/* Delete button */}
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

                            {/* Image Thumbnail */}
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', backgroundColor: '#FAF7FC' }}>
                              <img src={img.url} alt={`Product ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            {/* Primary Badge or Select Button */}
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
                    {saving ? 'Saving…' : editingProduct ? 'Update Product' : 'Create Product'}
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
