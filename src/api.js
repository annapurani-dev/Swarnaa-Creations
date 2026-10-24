// Prefer same-origin /api (Vite proxy). Fall back to direct backend URL.
const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_FALLBACK = 'http://localhost:3001/api';

const readError = async (response, fallback) => {
  try {
    const data = await response.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
};

/** Try primary API URL, then localhost backend — avoids Brave/proxy misses. */
const apiFetch = async (path, options) => {
  const pathWithSlash = path.startsWith('/') ? path : `/${path}`;
  const urls = [`${API_URL}${pathWithSlash}`, `${API_FALLBACK}${pathWithSlash}`];
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Network request failed');
};

export const signupUser = async ({ name, email, phone, password }) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, password }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to create account.'));
  }
  return response.json();
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to sign in.'));
  }
  return response.json();
};

export const requestPasswordReset = async (email) => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to start password reset.'));
  }
  return response.json();
};

export const resetPassword = async ({ email, code, password }) => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, password }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to reset password.'));
  }
  return response.json();
};

export const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const createProduct = async (data) => {
  const response = await apiFetch('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await readError(response, 'Failed to create product'));
  return response.json();
};

export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete product');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const fetchCategories = async (type) => {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  const response = await apiFetch(`/categories${query}`);
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to fetch categories'));
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const createCategory = async (name, type) => {
  const response = await apiFetch('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  });
  if (!response.ok) throw new Error(await readError(response, 'Failed to create category'));
  return response.json();
};

export const deleteCategory = async (id, { force = false } = {}) => {
  const query = force ? '?force=1' : '';
  const response = await apiFetch(`/categories/${id}${query}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to delete category'));
  }
};

export const fetchTutorials = async () => {
  try {
    const response = await fetch(`${API_URL}/tutorials`);
    if (!response.ok) throw new Error('Failed to fetch tutorials');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const fetchTutorial = async (id) => {
  try {
    const response = await fetch(`${API_URL}/tutorials/${id}`);
    if (!response.ok) throw new Error('Failed to fetch tutorial');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const fetchJournals = async () => {
  try {
    const response = await fetch(`${API_URL}/journals`);
    if (!response.ok) throw new Error('Failed to fetch journals');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const fetchJournal = async (id) => {
  try {
    const response = await fetch(`${API_URL}/journals/${id}`);
    if (!response.ok) throw new Error('Failed to fetch journal post');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const createTutorial = async (data) => {
  const response = await apiFetch('/tutorials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await readError(response, 'Failed to create tutorial'));
  return response.json();
};

export const deleteTutorial = async (id) => {
  try {
    const response = await fetch(`${API_URL}/tutorials/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete tutorial');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const fetchOrders = async (email) => {
  try {
    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await fetch(`${API_URL}/orders${qs}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const fetchPaymentConfig = async () => {
  try {
    const response = await fetch(`${API_URL}/payment-config`);
    if (!response.ok) throw new Error('Failed to fetch payment config');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const fetchUnlockedTutorials = async (email) => {
  if (!email) return [];
  const response = await fetch(`${API_URL}/learning?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error('Failed to fetch unlocked tutorials');
  const data = await response.json();
  return data.unlockedTutorialIds || [];
};

export const initiateOrder = async (payload) => {
  const response = await fetch(`${API_URL}/orders/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to initiate order');
  }
  return response.json();
};

export const confirmOrderPayment = async (orderId, screenshotFile) => {
  const formData = new FormData();
  formData.append('screenshot', screenshotFile);
  const response = await fetch(`${API_URL}/orders/${orderId}/confirm`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to confirm payment');
  }
  return response.json();
};

export const createOrder = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create order');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const response = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update order status');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const fetchHeroImages = async () => {
  try {
    const response = await fetch(`${API_URL}/hero-images`);
    if (!response.ok) throw new Error('Failed to fetch hero images');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const uploadHeroImage = async (file, side) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('side', side);
  const response = await fetch(`${API_URL}/hero-images`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload hero image');
  return await response.json();
};

export const deleteHeroImage = async (id) => {
  const response = await fetch(`${API_URL}/hero-images/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete hero image');
};
