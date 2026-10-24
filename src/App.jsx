import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { LearningProvider } from './context/LearningContext'
import { AddressProvider } from './context/AddressContext'
import { ToastProvider } from './context/ToastContext'
import { AdminPreviewProvider } from './context/AdminPreviewContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import CraftShop from './pages/CraftShop'
import ProductDetails from './pages/ProductDetails'
import CustomOrders from './pages/CustomOrders'
import Tutorials from './pages/Tutorials'
import TutorialDetail from './pages/TutorialDetail'
import Journal from './pages/Journal'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Payment from './pages/Payment'
import OrderSuccess from './pages/OrderSuccess'
import Profile from './pages/Profile'
import MyLearning from './pages/MyLearning'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import OrdersAdmin from './pages/admin/OrdersAdmin'
import ProductsAdmin from './pages/admin/ProductsAdmin'
import TutorialsAdmin from './pages/admin/TutorialsAdmin'
import CategoriesAdmin from './pages/admin/CategoriesAdmin'
import CustomRequestsAdmin from './pages/admin/CustomRequestsAdmin'
import HeroImagesAdmin from './pages/admin/HeroImagesAdmin'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminPreviewProvider>
          <AddressProvider>
            <CartProvider>
              <WishlistProvider>
                <LearningProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="shop" element={<CraftShop />} />
                        <Route path="shop/:id" element={<ProductDetails />} />
                        <Route path="custom-orders" element={<CustomOrders />} />
                        <Route path="tutorials" element={<Tutorials />} />
                        <Route path="tutorial/:id" element={<TutorialDetail />} />
                        <Route path="journal" element={<Journal />} />
                        <Route path="wishlist" element={<Wishlist />} />
                        <Route path="cart" element={<Cart />} />
                        <Route path="checkout" element={<Checkout />} />
                        <Route path="payment" element={<Payment />} />
                        <Route path="order-success" element={<OrderSuccess />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="learning" element={<MyLearning />} />
                      </Route>

                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="orders" element={<OrdersAdmin />} />
                        <Route path="products" element={<ProductsAdmin />} />
                        <Route path="tutorials" element={<TutorialsAdmin />} />
                        <Route path="categories" element={<CategoriesAdmin />} />
                        <Route path="hero-images" element={<HeroImagesAdmin />} />
                        <Route path="requests" element={<CustomRequestsAdmin />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </LearningProvider>
              </WishlistProvider>
            </CartProvider>
          </AddressProvider>
        </AdminPreviewProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
