const API_BASE = '/api';
function safeJSONParse(item, fallback) {
    try {
        const val = localStorage.getItem(item);
        return val && val !== 'undefined' ? JSON.parse(val) : fallback;
    } catch (e) {
        return fallback;
    }
}

let state = {
    token: localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined' ? localStorage.getItem('token') : null,
    user: safeJSONParse('user', null),
    cart: safeJSONParse('cart', []),
    products: []
};

// DOM Elements
const appContainer = document.getElementById('app-container');
const navLogin = document.getElementById('nav-login-item');
const navUser = document.getElementById('nav-user-item');
const navUsername = document.getElementById('nav-username');
const navAdmin = document.getElementById('nav-admin-item');
const navOrders = document.getElementById('nav-orders-item');
const cartCount = document.getElementById('cart-count');

const authModal = document.getElementById('auth-modal');
const productModal = document.getElementById('product-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const productForm = document.getElementById('product-form');

// Initialization
function init() {
    updateNav();
    renderHome();
    setupEventListeners();
}

function updateNav() {
    if (state.user && state.token) {
        navLogin.classList.add('hidden');
        navUser.classList.remove('hidden');
        navOrders.classList.remove('hidden');
        navUsername.textContent = state.user.email;
        
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
    
    const count = state.cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCount.textContent = count;
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function setupEventListeners() {
    document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); renderHome(); });
    document.getElementById('nav-cart').addEventListener('click', (e) => { e.preventDefault(); renderCart(); });
    document.getElementById('nav-orders').addEventListener('click', (e) => { e.preventDefault(); renderOrders(); });
    document.getElementById('nav-admin').addEventListener('click', (e) => { e.preventDefault(); renderAdmin(); });
    document.querySelector('.logo').addEventListener('click', renderHome);
    
    document.getElementById('nav-login').addEventListener('click', (e) => {
        e.preventDefault();
        authModal.classList.remove('hidden');
    });
    
    document.getElementById('nav-logout').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    document.getElementById('tab-login').addEventListener('click', (e) => {
        e.target.classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        document.getElementById('auth-error').textContent = '';
    });

    document.getElementById('tab-register').addEventListener('click', (e) => {
        e.target.classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        document.getElementById('auth-error').textContent = '';
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    productForm.addEventListener('submit', handleSaveProduct);
}

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }
    return headers;
}

// ==================== VIEWS ====================

async function renderHome() {
    appContainer.innerHTML = `
        <div class="hero glass animate-fade-in">
            <h2>Premium Quality Tiles</h2>
            <p>Elevate your space with our curated collection of stunning, durable tiles.</p>
            <button class="btn primary" onclick="document.getElementById('products-section').scrollIntoView({behavior: 'smooth'})">Shop Now</button>
        </div>
        
        <div id="products-section" class="products-section">
            <h3 style="font-size: 2rem; margin-bottom: 2rem;">Featured Products</h3>
            <div id="product-grid" class="product-grid">
                <div style="text-align:center; grid-column: 1/-1;">Loading products...</div>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/products`, { headers: getAuthHeaders() });
        if (response.status === 403 || response.status === 401) {
            document.getElementById('product-grid').innerHTML = `
                <div style="grid-column: 1/-1; text-align:center;">
                    <p style="color: var(--error); margin-bottom: 1rem;">Authentication required to view products.</p>
                    <button class="btn primary" onclick="document.getElementById('nav-login').click()">Login / Register</button>
                </div>
            `;
            return;
        }
        const data = await response.json();
        
        if (data.success) {
            state.products = data.data.content;
            const grid = document.getElementById('product-grid');
            if (!state.products.length) {
                grid.innerHTML = `<p>No products found.</p>`;
                return;
            }

            grid.innerHTML = state.products.map((product, index) => `
                <div class="product-card glass animate-fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="product-image"><span>🧱</span></div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted)">Brand: ${product.brand || 'N/A'} | Size: ${product.size || 'N/A'}</p>
                        <p>${product.description || 'Premium quality tile for modern interiors.'}</p>
                        <p style="font-size:0.8rem; color:${product.stock > 0 ? 'var(--success)' : 'var(--error)'}">
                            ${product.stock > 0 ? 'In Stock: ' + product.stock : 'Out of Stock'}
                        </p>
                        <div class="product-footer" style="margin-top: 1rem;">
                            <span class="product-price">₹${product.price}</span>
                            <button class="btn primary" ${product.stock === 0 ? 'disabled' : ''} onclick="addToCart(${product.id})">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        document.getElementById('product-grid').innerHTML = `<div class="error-msg">Network error. Backend not reachable.</div>`;
    }
}

function renderCart() {
    if (state.cart.length === 0) {
        appContainer.innerHTML = `
            <div class="glass animate-fade-in" style="padding: 4rem; text-align: center;">
                <h2>Your Cart is Empty</h2>
                <p style="margin: 2rem 0; color: var(--text-muted)">Looks like you haven't added any products yet.</p>
                <button class="btn primary" onclick="renderHome()">Continue Shopping</button>
            </div>
        `;
        return;
    }

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    appContainer.innerHTML = `
        <h2 style="margin-bottom: 2rem; font-size: 2rem;" class="animate-fade-in">Shopping Cart</h2>
        <div class="cart-list animate-fade-in">
            ${state.cart.map(item => `
                <div class="cart-item glass">
                    <div style="display:flex; align-items:center; gap: 1rem;">
                        <div style="font-size: 2rem;">🧱</div>
                        <div>
                            <h3>${item.name}</h3>
                            <p style="color: var(--text-muted)">₹${item.price} x ${item.quantity}</p>
                        </div>
                    </div>
                    <div style="font-weight: bold; font-size: 1.2rem;">
                        ₹${item.price * item.quantity}
                    </div>
                    <button class="btn secondary" style="padding: 0.5rem 1rem;" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `).join('')}
        </div>
        <div class="cart-total animate-fade-in">Total: ₹${total}</div>
        <div style="text-align: right;" class="animate-fade-in">
            <button class="btn primary" onclick="checkout()">Proceed to Checkout</button>
        </div>
    `;
}

async function renderOrders() {
    if (!state.token) return;
    
    appContainer.innerHTML = `
        <h2 style="margin-bottom: 2rem; font-size: 2rem;" class="animate-fade-in">My Orders</h2>
        <div id="orders-list">Loading orders...</div>
    `;

    try {
        const res = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        if (data.success) {
            const orders = data.data;
            if (orders.length === 0) {
                document.getElementById('orders-list').innerHTML = `<p>No past orders found.</p>`;
                return;
            }
            
            document.getElementById('orders-list').innerHTML = orders.map(order => `
                <div class="glass animate-fade-in" style="padding: 1.5rem; margin-bottom: 1rem;">
                    <div style="display:flex; justify-content: space-between; margin-bottom: 1rem;">
                        <h3>Order #${order.id}</h3>
                        <span style="font-weight:bold; color: ${order.status === 'PAID' ? 'var(--success)' : 'var(--error)'}">${order.status}</span>
                    </div>
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">Date: ${new Date(order.createdAt).toLocaleString()}</p>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        ${order.items.map(item => `<p>🧱 ${item.productName} - Qty: ${item.quantity} (₹${item.price})</p>`).join('')}
                    </div>
                    <div style="text-align: right; font-weight: bold; font-size: 1.2rem; margin-top: 1rem;">
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
    if (!state.token || (state.user.role !== 'SELLER' && state.user.role !== 'ADMIN')) return;
    
    appContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;" class="animate-fade-in">
            <h2 style="font-size: 2rem;">Seller Dashboard</h2>
            <button class="btn primary" onclick="openProductModal()">+ Add New Product</button>
        </div>
        <div id="admin-product-list" class="animate-fade-in">Loading products...</div>
    `;
    
    fetchProductsForAdmin();
}

async function fetchProductsForAdmin() {
    try {
        const res = await fetch(`${API_BASE}/products`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        if (data.success) {
            const products = data.data.content;
            const list = document.getElementById('admin-product-list');
            if (products.length === 0) {
                list.innerHTML = `<p>No products available.</p>`;
                return;
            }
            
            list.innerHTML = `
                <table style="width: 100%; text-align: left; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <th style="padding: 1rem;">ID</th>
                            <th style="padding: 1rem;">Name</th>
                            <th style="padding: 1rem;">Price</th>
                            <th style="padding: 1rem;">Stock</th>
                            <th style="padding: 1rem;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(p => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 1rem;">${p.id}</td>
                                <td style="padding: 1rem;">${p.name}</td>
                                <td style="padding: 1rem;">₹${p.price}</td>
                                <td style="padding: 1rem;">${p.stock}</td>
                                <td style="padding: 1rem;">
                                    <button class="btn secondary" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;" onclick='openProductModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
                                    <button class="btn secondary" style="padding: 0.25rem 0.5rem; font-size: 0.9rem; color: var(--error); border-color: var(--error);" onclick="deleteProduct(${p.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch(e) {
        document.getElementById('admin-product-list').innerHTML = `<p class="error-msg">Error loading products.</p>`;
    }
}

// ==================== LOGIC ====================

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = state.cart.find(item => item.id === productId);
    if (existingItem) {
        if(existingItem.quantity >= product.stock) {
            alert('Cannot add more than available stock.');
            return;
        }
        existingItem.quantity += 1;
    } else {
        if(product.stock === 0) {
            alert('Product is out of stock.');
            return;
        }
        state.cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateNav();
    alert(`Added ${product.name} to cart!`);
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    updateNav();
    renderCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('auth-error');

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
            authModal.classList.add('hidden');
            updateNav();
        } else {
            errorEl.textContent = data.message || 'Login failed';
        }
    } catch (err) {
        errorEl.textContent = 'Network error';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const mobile = document.getElementById('reg-mobile').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const errorEl = document.getElementById('auth-error');

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, mobile, password, role })
        });
        const data = await res.json();

        if (data.success) {
            alert('Registration successful! Please login.');
            document.getElementById('tab-login').click();
        } else {
            errorEl.textContent = data.message || 'Registration failed';
        }
    } catch (err) {
        errorEl.textContent = 'Network error';
    }
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateNav();
    renderHome();
}

// Admin / Seller Logic
function openProductModal(product = null) {
    const errorEl = document.getElementById('product-error');
    errorEl.textContent = '';
    
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
        document.getElementById('product-modal-title').textContent = 'Create Product';
        document.getElementById('product-form').reset();
        document.getElementById('prod-id').value = '';
    }
    
    productModal.classList.remove('hidden');
}

async function handleSaveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const brand = document.getElementById('prod-brand').value;
    const size = document.getElementById('prod-size').value;
    const description = document.getElementById('prod-desc').value;
    const price = document.getElementById('prod-price').value;
    const stock = document.getElementById('prod-stock').value;
    const errorEl = document.getElementById('product-error');

    const payload = { name, brand, size, description, price: parseFloat(price), stock: parseInt(stock) };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            closeModal('product-modal');
            fetchProductsForAdmin(); 
        } else {
            errorEl.textContent = data.message || 'Failed to save product';
        }
    } catch (err) {
        errorEl.textContent = 'Network error';
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            fetchProductsForAdmin();
        } else {
            alert('Failed to delete product: ' + data.message);
        }
    } catch(e) {
        alert('Network error');
    }
}

// Checkout and Payment Flow
async function checkout() {
    if (!state.token) {
        alert('Please login to checkout');
        authModal.classList.remove('hidden');
        return;
    }

    if (state.cart.length === 0) return;

    try {
        const orderItems = state.cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
        }));

        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ items: orderItems })
        });
        
        const data = await res.json();
        if (data.success) {
            // Initiate Mock Razorpay Flow
            const order = data.data;
            const razorpayOrderId = order.razorpayOrderId;
            
            // To simulate production Razorpay UI without real keys, we prompt the user
            // In a real scenario with Razorpay keys, we would do:
            /*
            var options = {
                "key": "YOUR_RAZORPAY_KEY", 
                "amount": order.totalAmount * 100, 
                "currency": "INR",
                "name": "SuperTiles Ecommerce",
                "description": "Order Payment",
                "order_id": razorpayOrderId,
                "handler": function (response){
                    verifyPayment(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
                }
            };
            var rzp1 = new Razorpay(options);
            rzp1.open();
            */
            
            alert(`Order Created Successfully! (Mocking Razorpay UI...)\nOrder ID: ${order.id}\nProceeding to dummy payment verification...`);
            
            // Simulate calling the verification endpoint with dummy data
            // It will fail on the backend due to invalid signature, but the order remains
            verifyPayment("dummy_payment_id", razorpayOrderId, "dummy_signature");
            
        } else {
            alert('Failed to place order: ' + data.message);
        }
    } catch (err) {
        alert('Network error during checkout');
    }
}

async function verifyPayment(paymentId, orderId, signature) {
    try {
        const res = await fetch(`${API_BASE}/payments/verify`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
                razorpaySignature: signature
            })
        });
        const data = await res.json();
        
        // Since we are using dummy data, signature verification WILL fail
        if (data.success) {
            alert('Payment Successful!');
        } else {
            alert(`Payment Simulation Complete.\nStatus: ${data.message} (Expected with dummy signature). Your order was recorded.`);
        }
        
        state.cart = [];
        saveCart();
        updateNav();
        renderOrders();
        
    } catch(e) {
        alert('Payment verification request failed.');
    }
}

// Start app
init();
