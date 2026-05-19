const API_BASE = '/api';

// Safe Parsing
function safeJSONParse(item, fallback) {
    try {
        const val = localStorage.getItem(item);
        return val && val !== 'undefined' ? JSON.parse(val) : fallback;
    } catch (e) { return fallback; }
}

let state = {
    token: localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined' ? localStorage.getItem('token') : null,
    user: safeJSONParse('user', null),
    cart: safeJSONParse('cart', []),
    products: []
};

// DOM Elements
const appContainer = document.getElementById('app-container');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-drawer-overlay');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const authModal = document.getElementById('auth-modal');
const productModal = document.getElementById('product-modal');

// Init
function init() {
    updateNav();
    renderHome();
    setupEventListeners();
}

function updateNav() {
    const navLogin = document.getElementById('nav-login-item');
    const navUser = document.getElementById('nav-user-item');
    const navOrders = document.getElementById('nav-orders-item');
    const navAdmin = document.getElementById('nav-admin-item');
    
    if (state.user && state.token) {
        navLogin.classList.add('hidden');
        navUser.classList.remove('hidden');
        navOrders.classList.remove('hidden');
        document.getElementById('nav-username').innerHTML = `<i class="fas fa-user-circle"></i> ${state.user.name || state.user.email.split('@')[0]}`;
        
        if (state.user.role === 'SELLER' || state.user.role === 'ADMIN') {
            navAdmin.classList.remove('hidden');
        } else {
            navAdmin.classList.add('hidden');
        }
    } else {
        navLogin.classList.remove('hidden');
        navUser.classList.add('hidden');
        navAdmin.classList.add('hidden');
        navOrders.classList.add('hidden');
    }
    updateCartUI();
}

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    return headers;
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if(type === 'success') icon = 'check-circle';
    if(type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Event Listeners
function setupEventListeners() {
    // Nav Routing
    document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); setActiveNav('nav-home'); renderHome(); });
    document.getElementById('nav-orders').addEventListener('click', (e) => { e.preventDefault(); setActiveNav('nav-orders'); renderOrders(); });
    document.getElementById('nav-admin').addEventListener('click', (e) => { e.preventDefault(); setActiveNav('nav-admin'); renderAdmin(); });
    document.getElementById('nav-logo').addEventListener('click', () => { setActiveNav('nav-home'); renderHome(); });
    
    // Auth & User
    document.getElementById('nav-login-item').addEventListener('click', () => authModal.classList.remove('hidden'));
    document.getElementById('nav-logout').addEventListener('click', (e) => { e.preventDefault(); logout(); });
    
    // Cart Drawer
    document.getElementById('nav-cart').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    document.getElementById('btn-checkout').addEventListener('click', checkout);
    
    // Auth Tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            if(e.target.dataset.tab === 'login') {
                document.getElementById('login-form').classList.remove('hidden');
                document.getElementById('register-form').classList.add('hidden');
            } else {
                document.getElementById('register-form').classList.remove('hidden');
                document.getElementById('login-form').classList.add('hidden');
            }
            document.getElementById('auth-error').textContent = '';
        });
    });

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('product-form').addEventListener('submit', handleSaveProduct);
}

function setActiveNav(id) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    if(id !== 'nav-logo') document.getElementById(id).classList.add('active');
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openCart() { cartDrawer.classList.add('active'); cartOverlay.classList.add('active'); }
function closeCart() { cartDrawer.classList.remove('active'); cartOverlay.classList.remove('active'); }

// Helpers for realistic images based on product ID
function getTileImage(id) {
    const images = [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80',
        'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=500&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=500&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=500&q=80'
    ];
    return images[id % images.length];
}

// ==================== VIEWS ====================

async function renderHome() {
    appContainer.innerHTML = `
        <div class="hero animate-fade-up">
            <div class="hero-content glass-panel" style="padding: 3rem; background: rgba(9,9,11,0.6);">
                <h2>Redefine Your Space</h2>
                <p>Discover our exclusive collection of premium ceramic and porcelain tiles, designed to bring elegance and durability to modern homes.</p>
                <button class="btn btn-primary btn-glow" onclick="document.getElementById('products-section').scrollIntoView({behavior: 'smooth'})">Explore Collection <i class="fas fa-arrow-down"></i></button>
            </div>
        </div>
        
        <div id="products-section">
            <h3 class="section-title animate-fade-up">Featured Collection</h3>
            <div id="product-grid" class="product-grid">
                ${[1,2,3,4].map(i => `<div class="product-card skeleton" style="height:400px;"></div>`).join('')}
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/products`, { headers: getAuthHeaders() });
        if (response.status === 403 || response.status === 401) {
            document.getElementById('product-grid').innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 4rem;" class="glass-panel animate-fade-up">
                    <i class="fas fa-lock" style="font-size: 3rem; color: var(--error); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 1rem;">Authentication Required</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">Please sign in to view our exclusive product catalog.</p>
                    <button class="btn btn-primary" onclick="authModal.classList.remove('hidden')">Sign In Now</button>
                </div>
            `;
            return;
        }
        
        const data = await response.json();
        if (data.success) {
            state.products = data.data.content;
            const grid = document.getElementById('product-grid');
            if (!state.products.length) {
                grid.innerHTML = `<div class="glass-panel" style="grid-column:1/-1; padding:3rem; text-align:center;">No products available at the moment.</div>`;
                return;
            }

            grid.innerHTML = state.products.map((product, index) => `
                <div class="product-card animate-fade-up" style="animation-delay: ${index * 0.1}s">
                    <div class="product-image" style="background-image: url('${getTileImage(product.id)}')">
                        ${product.stock === 0 ? '<span class="product-badge" style="background:var(--error)">Sold Out</span>' : ''}
                    </div>
                    <div class="product-info">
                        <span class="product-brand">${product.brand || 'Premium'}</span>
                        <h3>${product.name}</h3>
                        <p class="product-desc">${product.description || 'Premium quality material designed for modern aesthetics.'}</p>
                        <div class="product-footer">
                            <span class="product-price">₹${product.price}</span>
                            <button class="btn btn-primary" ${product.stock === 0 ? 'disabled' : ''} onclick="addToCart(${product.id})">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        document.getElementById('product-grid').innerHTML = `<div class="error-msg">Failed to connect to server.</div>`;
    }
}

async function renderOrders() {
    appContainer.innerHTML = `
        <h2 class="section-title animate-fade-up">Order History</h2>
        <div id="orders-list" class="animate-fade-up">
            <div class="skeleton" style="height: 100px; margin-bottom: 1rem;"></div>
            <div class="skeleton" style="height: 100px; margin-bottom: 1rem;"></div>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        if (data.success) {
            const orders = data.data;
            const list = document.getElementById('orders-list');
            if (orders.length === 0) {
                list.innerHTML = `<div class="data-card text-center"><p>You haven't placed any orders yet.</p></div>`;
                return;
            }
            
            list.innerHTML = orders.map(order => `
                <div class="data-card animate-fade-up">
                    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                        <div>
                            <h3 style="margin-bottom:0.25rem;">Order #${order.id}</h3>
                            <span style="color:var(--text-secondary); font-size:0.9rem;">
                                <i class="far fa-calendar-alt"></i> ${new Date(order.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <span class="status-badge ${order.status === 'PAID' ? 'status-paid' : 'status-failed'}">
                            ${order.status}
                        </span>
                    </div>
                    <div style="display:grid; gap:1rem; margin-bottom:1.5rem;">
                        ${order.items.map(item => `
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap:1rem;">
                                    <div style="width:40px; height:40px; border-radius:8px; background:url('${getTileImage(item.productId)}') center/cover;"></div>
                                    <span>${item.productName} <span style="color:var(--text-secondary)">x${item.quantity}</span></span>
                                </div>
                                <span>₹${item.price * item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="text-align: right; font-size: 1.25rem; font-weight:700; color: var(--primary);">
                        Total: ₹${order.totalAmount}
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        document.getElementById('orders-list').innerHTML = `<p class="error-msg">Failed to load orders.</p>`;
    }
}

async function renderAdmin() {
    appContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;" class="animate-fade-up">
            <h2 class="section-title" style="margin:0;">Seller Dashboard</h2>
            <button class="btn btn-primary btn-glow" onclick="openProductModal()"><i class="fas fa-plus"></i> New Product</button>
        </div>
        <div class="data-card animate-fade-up" style="padding: 0; overflow:hidden;">
            <div id="admin-product-list" style="overflow-x:auto;">
                <div style="padding: 2rem;"><div class="skeleton" style="height: 200px;"></div></div>
            </div>
        </div>
    `;
    
    try {
        const res = await fetch(`${API_BASE}/products`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        if (data.success) {
            const products = data.data.content;
            const list = document.getElementById('admin-product-list');
            if (products.length === 0) {
                list.innerHTML = `<div style="padding:3rem; text-align:center; color:var(--text-secondary);">No products in inventory. Start by adding one.</div>`;
                return;
            }
            
            list.innerHTML = `
                <table>
                    <thead style="background: rgba(255,255,255,0.02);">
                        <tr>
                            <th>Product</th>
                            <th>Brand & Size</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th style="text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(p => `
                            <tr>
                                <td>
                                    <div style="display:flex; align-items:center; gap:1rem;">
                                        <div style="width:40px; height:40px; border-radius:8px; background:url('${getTileImage(p.id)}') center/cover;"></div>
                                        <span style="font-weight:500;">${p.name}</span>
                                    </div>
                                </td>
                                <td style="color:var(--text-secondary);">${p.brand || '-'} <br/> ${p.size || '-'}</td>
                                <td style="font-weight:600;">₹${p.price}</td>
                                <td>
                                    <span class="status-badge" style="background:${p.stock > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color:${p.stock > 0 ? 'var(--success)' : 'var(--error)'}">
                                        ${p.stock} units
                                    </span>
                                </td>
                                <td style="text-align:right;">
                                    <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; margin-right:0.5rem;" onclick='openProductModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; color:var(--error); border-color:rgba(239,68,68,0.3);" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch(e) {
        document.getElementById('admin-product-list').innerHTML = `<p class="error-msg" style="padding:2rem;">Error loading inventory.</p>`;
    }
}

// ==================== CART & CHECKOUT ====================

function updateCartUI() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count;
    
    if (state.cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align:center; padding: 3rem 0; color:var(--text-secondary);">
                <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 1rem; opacity:0.5;"></i>
                <p>Your bag is empty.</p>
            </div>
        `;
        cartTotalPrice.textContent = '₹0.00';
        document.getElementById('btn-checkout').disabled = true;
        return;
    }

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = `₹${total.toLocaleString()}`;
    document.getElementById('btn-checkout').disabled = false;

    cartItemsContainer.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img" style="background-image: url('${getTileImage(item.id)}')"></div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
                    <span style="color:var(--text-secondary); font-size:0.9rem;">Qty: ${item.quantity}</span>
                    <span class="cart-item-price">₹${item.price * item.quantity}</span>
                </div>
                <div class="cart-item-actions">
                    <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Remove</button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = state.cart.find(item => item.id === productId);
    if (existingItem) {
        if(existingItem.quantity >= product.stock) {
            showToast('Cannot add more than available stock.', 'error');
            return;
        }
        existingItem.quantity += 1;
    } else {
        if(product.stock === 0) {
            showToast('Product is out of stock.', 'error');
            return;
        }
        state.cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartUI();
    showToast(`${product.name} added to bag!`, 'success');
    openCart();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartUI();
}

async function checkout() {
    if (!state.token) {
        closeCart();
        showToast('Please sign in to checkout', 'error');
        authModal.classList.remove('hidden');
        return;
    }

    const btn = document.getElementById('btn-checkout');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    try {
        const orderItems = state.cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price }));
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ items: orderItems })
        });
        
        const data = await res.json();
        if (data.success) {
            const order = data.data;
            // Simulated Razorpay UI Flow
            showToast('Order created! Initializing secure payment...', 'info');
            
            setTimeout(() => {
                // Verify mock payment after 2s delay
                verifyPayment("pay_mock_" + Math.random().toString(36).substring(7), order.razorpayOrderId, "mock_signature");
            }, 2000);
            
        } else {
            showToast(data.message || 'Checkout failed', 'error');
            btn.innerHTML = 'Checkout Securely <i class="fas fa-arrow-right"></i>';
            btn.disabled = false;
        }
    } catch (err) {
        showToast('Network error during checkout', 'error');
        btn.innerHTML = 'Checkout Securely <i class="fas fa-arrow-right"></i>';
        btn.disabled = false;
    }
}

async function verifyPayment(paymentId, orderId, signature) {
    try {
        const res = await fetch(`${API_BASE}/payments/verify`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ razorpayPaymentId: paymentId, razorpayOrderId: orderId, razorpaySignature: signature })
        });
        const data = await res.json();
        
        closeCart();
        showToast('Payment Simulation Complete. Order Recorded.', 'success');
        
        state.cart = [];
        localStorage.setItem('cart', JSON.stringify([]));
        updateCartUI();
        
        setActiveNav('nav-orders');
        renderOrders();
        
    } catch(e) {
        showToast('Payment verification failed.', 'error');
        document.getElementById('btn-checkout').innerHTML = 'Checkout Securely <i class="fas fa-arrow-right"></i>';
        document.getElementById('btn-checkout').disabled = false;
    }
}

// ==================== AUTH & ADMIN ====================

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('auth-error');
    errorEl.textContent = 'Signing in...';

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            state.token = data.data.token;
            state.user = data.data; 
            localStorage.setItem('token', state.token);
            localStorage.setItem('user', JSON.stringify(state.user));
            closeModal('auth-modal');
            updateNav();
            renderHome();
            showToast('Welcome back!', 'success');
        } else {
            errorEl.textContent = data.message || 'Invalid credentials';
        }
    } catch (err) { errorEl.textContent = 'Network error'; }
}

async function handleRegister(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        mobile: document.getElementById('reg-mobile').value,
        password: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value
    };
    const errorEl = document.getElementById('auth-error');
    errorEl.textContent = 'Creating account...';

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            showToast('Account created! Please sign in.', 'success');
            document.querySelector('.auth-tab[data-tab="login"]').click();
            document.getElementById('login-email').value = payload.email;
        } else {
            errorEl.textContent = data.message || 'Registration failed';
        }
    } catch (err) { errorEl.textContent = 'Network error'; }
}

function logout() {
    state.token = null; state.user = null;
    localStorage.removeItem('token'); localStorage.removeItem('user');
    updateNav();
    setActiveNav('nav-home');
    renderHome();
    showToast('Signed out successfully', 'info');
}

function openProductModal(product = null) {
    document.getElementById('product-error').textContent = '';
    const form = document.getElementById('product-form');
    
    if (product) {
        document.getElementById('product-modal-title').textContent = 'Edit Product';
        document.getElementById('prod-id').value = product.id;
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-brand').value = product.brand;
        document.getElementById('prod-size').value = product.size;
        document.getElementById('prod-desc').value = product.description;
        document.getElementById('prod-price').value = product.price;
        document.getElementById('prod-stock').value = product.stock;
    } else {
        document.getElementById('product-modal-title').textContent = 'Create New Product';
        form.reset();
        document.getElementById('prod-id').value = '';
    }
    productModal.classList.remove('hidden');
}

async function handleSaveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const payload = {
        name: document.getElementById('prod-name').value,
        brand: document.getElementById('prod-brand').value,
        size: document.getElementById('prod-size').value,
        description: document.getElementById('prod-desc').value,
        price: parseFloat(document.getElementById('prod-price').value),
        stock: parseInt(document.getElementById('prod-stock').value)
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;

    try {
        const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
        const data = await res.json();

        if (data.success) {
            closeModal('product-modal');
            showToast('Product saved successfully', 'success');
            renderAdmin(); 
        } else {
            document.getElementById('product-error').textContent = data.message || 'Failed to save';
        }
    } catch (err) { document.getElementById('product-error').textContent = 'Network error'; }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
        const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) {
            showToast('Product deleted', 'success');
            renderAdmin();
        } else { showToast(data.message, 'error'); }
    } catch(e) { showToast('Network error', 'error'); }
}

init();
