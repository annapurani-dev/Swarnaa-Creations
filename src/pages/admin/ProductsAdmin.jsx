import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Edit, Trash2, Plus, X, RefreshCw } from 'lucide-react'
import { fetchProducts, createProduct, deleteProduct, fetchCategories } from '../../api'
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
    setCategoryId(product?.categoryId ? String(product.categoryId) : '')
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
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    if (editingProduct) {
      toast.info('Edit product not implemented on backend yet!')
      handleCloseModal()
      return
    }

    if (!categoryId) {
      toast.error('Choose a category.')
      return
    }

    try {
      await createProduct({
        name: formData.get('name'),
        categoryId: Number(categoryId),
        price: formData.get('price'),
        stock: formData.get('stock'),
        image: '/crochet_tote.jpg',
      })
      toast.success('Product created.')
      handleCloseModal()
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to create product.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id)
        setProducts(products.filter((p) => p.id !== id))
      } catch (err) {
        toast.error('Failed to delete product.')
      }
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>Product Catalog</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Manage shop inventory and pricing.
            {categories.length > 0 && (
              <span style={{ marginLeft: 8 }}>
                · {categories.length} product categor{categories.length === 1 ? 'y' : 'ies'} loaded
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search products..."
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
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', width: '80px' }}></th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Product Name</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Price</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Stock</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, i) => (
              <tr key={product.id} style={{ borderBottom: i === filteredProducts.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <img src={product.image} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{product.name}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{product.category}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>₹{product.price}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: product.stock > 10 ? '#2E7D32' : '#e74c3c', fontWeight: 500 }}>
                  {product.stock || 15} left
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => handleOpenModal(product)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Edit size={18} />
                    </button>
                    <button type="button" onClick={() => handleDelete(product.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No products found matching &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <button type="button" onClick={handleCloseModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={24} /></button>

              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-text)', marginBottom: '24px' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>

              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Product Name</label>
                  <input required name="name" defaultValue={editingProduct?.name || ''} type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label htmlFor="product-category" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
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
                    id="product-category"
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
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Price (₹)</label>
                    <input required name="price" defaultValue={editingProduct?.price || ''} type="number" min="0" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Stock</label>
                    <input required name="stock" defaultValue={editingProduct?.stock || 0} type="number" min="0" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-brand)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
