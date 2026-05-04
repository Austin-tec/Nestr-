// Main Application - Fully Fixed Version
console.log('🚀 Loading StudentRent App...');

class App {
    static init() {
        console.log('🔧 Initializing StudentRent App...');

        try {
            // Wait for DOM to be fully ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showFatalError(error);
        }
    }

    static initializeApp() {
        console.log('🎯 Starting app initialization...');

        // Check if all required elements exist
        if (!this.checkRequiredElements()) {
            return;
        }

        // Initialize data first
        this.initializeData();

        // Initialize services
        this.initializeServices();

        // Initialize router
        this.initializeRouter();

        // Add global event listeners
        this.addGlobalListeners();

        // Initialize mobile menu
        this.initMobileMenu();

        console.log('🎉 StudentRent App initialized successfully!');
        Utils.showNotification('App loaded successfully!', 'success', 2000);
    }

    static checkRequiredElements() {
        const requiredElements = [
            'main-content',
            'navAuth',
            'navLinks'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));

        if (missingElements.length > 0) {
            console.error('❌ Missing required elements:', missingElements);
            this.showFatalError(`Missing elements: ${missingElements.join(', ')}`);
            return false;
        }

        console.log('✅ All required elements found');
        return true;
    }

    static initializeData() {
        console.log('📊 Initializing data...');
        try {
            Utils.initializeData();
            console.log('✅ Data initialized successfully');
        } catch (error) {
            console.error('❌ Data initialization failed:', error);
        }
    }

    static initializeServices() {
        console.log('⚙️ Initializing services...');

        // Initialize Utils first (it's the foundation)
        if (window.Utils) {
            try {
                Utils.init();
                console.log('✅ Utils initialized');
            } catch (error) {
                console.error('❌ Utils initialization failed:', error);
            }
        }

        // Initialize AuthService
        if (window.AuthService) {
            try {
                AuthService.init();
                console.log('✅ AuthService initialized');
            } catch (error) {
                console.error('❌ AuthService initialization failed:', error);
            }
        }

        // Initialize PropertyService
        if (window.PropertyService) {
            try {
                PropertyService.init();
                console.log('✅ PropertyService initialized');
            } catch (error) {
                console.error('❌ PropertyService initialization failed:', error);
            }
        }
    }

    static initializeRouter() {
        console.log('🛣️ Initializing router...');

        if (window.Router) {
            try {
                Router.init();
                console.log('✅ Router initialized');
            } catch (error) {
                console.error('❌ Router initialization failed:', error);
                // Fallback to basic routing
                this.setupFallbackRouting();
            }
        } else {
            console.error('❌ Router not found, setting up fallback routing');
            this.setupFallbackRouting();
        }
    }

    static setupFallbackRouting() {
        console.log('🔀 Setting up fallback routing...');

        // Basic hash change listener
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1) || 'home';
            console.log('Fallback routing to:', hash);

            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="container">
                        <h1>${hash.charAt(0).toUpperCase() + hash.slice(1)} Page</h1>
                        <p>This is the ${hash} page (fallback mode)</p>
                        <button class="btn btn-primary" onclick="window.location.hash = 'home'">
                            Go Home
                        </button>
                    </div>
                `;
            }
        });

        // Trigger initial route
        window.dispatchEvent(new Event('hashchange'));
    }

    static initMobileMenu() {
        console.log('📱 Initializing mobile menu...');

        const mobileMenu = document.getElementById('mobileMenu');
        const navLinks = document.getElementById('navLinks');

        if (mobileMenu && navLinks) {
            mobileMenu.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                console.log('Mobile menu toggled');
            });

            // Close mobile menu when clicking on a link
            navLinks.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    navLinks.classList.remove('active');
                }
            });

            console.log('✅ Mobile menu initialized');
        } else {
            console.warn('⚠️ Mobile menu elements not found');
        }
    }

    static addGlobalListeners() {
        console.log('🎧 Adding global event listeners...');

        // Global login handler
        window.handleLogin = async function (event) {
            if (event) event.preventDefault();
            console.log('Login attempt...');

            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');

            if (!emailInput || !passwordInput) {
                Utils.showNotification('Login form not found', 'error');
                return;
            }

            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                Utils.showNotification('Please enter both email and password', 'error');
                return;
            }

            console.log('Logging in with:', { email, password: '***' });

            try {
                const user = await AuthService.login(email, password);
                if (user) {
                    const emailOk =
                        user.email_verified === true ||
                        user.email_verified === 'true' ||
                        user.email_verified === 't';
                    if (!emailOk) {
                        Utils.showNotification('Verify your email to continue.', 'warning');
                        Router.navigate('verify-email');
                        return;
                    }
                    if (user.role === 'tenant') {
                        Router.navigate('tenant');
                    } else {
                        Router.navigate('landlord');
                    }
                } else {
                    console.log('Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                Utils.showNotification('Login failed: ' + error.message, 'error');
            }
        };

        // Global signup handler
        window.handleSignup = async function (event) {
            if (event) event.preventDefault();
            console.log('Signup attempt...');

            const nameInput = document.getElementById('signupName');
            const emailInput = document.getElementById('signupEmail');
            const phoneInput = document.getElementById('signupPhone');
            const passwordInput = document.getElementById('signupPassword');
            const roleInput = document.getElementById('signupRole');

            if (!nameInput || !emailInput || !phoneInput || !passwordInput || !roleInput) {
                Utils.showNotification('Signup form not found', 'error');
                return;
            }

            const name = nameInput.value;
            const email = emailInput.value;
            const phone = phoneInput.value;
            const password = passwordInput.value;
            const role = roleInput.value;

            if (!name || !email || !phone || !password || !role) {
                Utils.showNotification('Please fill in all fields', 'error');
                return;
            }

            console.log('Signing up with:', { name, email, phone: '***', password: '***', role });

            try {
                const userData = { name, email, phone, password, role };
                const user = await AuthService.register(userData);

                if (user) {
                    Router.navigate('verify-email');
                } else {
                    console.log('Signup failed');
                }
            } catch (error) {
                console.error('Signup error:', error);
                Utils.showNotification('Signup failed: ' + error.message, 'error');
            }
        };

        // Global modal handlers
        window.handleUpgrade = function (plan) {
            Utils.showLoading();
            const token = localStorage.getItem('user_token');
            fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan: plan })
            })
            .then(res => res.json())
            .then(data => {
                Utils.hideLoading();
                if (data.auth_url) {
                    if (data.note) Utils.showNotification(data.note, 'info');
                    window.location.href = data.auth_url;
                } else {
                    throw new Error(data.error || 'Failed to initialize payment');
                }
            })
            .catch(error => {
                Utils.hideLoading();
                console.error('Upgrade error:', error);
                Utils.showNotification(error.message, 'error');
            });
        };

        window.showAddPropertyModal = function () {
            console.log('Showing add property modal...');
            const modal = document.getElementById('addPropertyModal');
            if (modal) {
                modal.style.display = 'flex';
            }
        };

        window.closeAddPropertyModal = function () {
            console.log('❌ Closing property modal...');
            const modal = document.getElementById('addPropertyModal');
            if (modal) {
                modal.style.display = 'none';
            }
        };

        window.handleImageUpload = function (event) {
            const files = event.target.files;
            const preview = document.getElementById('imagePreview');
            if (!preview) return;

            preview.innerHTML = '';
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Preview';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        };

        window.handleAddProperty = async function (event) {
            if (event) event.preventDefault();
            console.log('📦 Handling add property...');

            const title = document.getElementById('propTitle')?.value;
            const description = document.getElementById('propDescription')?.value;
            const price = parseInt(document.getElementById('propPrice')?.value);
            const type = document.getElementById('propType')?.value;
            const bedrooms = parseInt(document.getElementById('propBedrooms')?.value);
            const bathrooms = parseInt(document.getElementById('propBathrooms')?.value);
            const state = document.getElementById('propState')?.value;
            const city = document.getElementById('propCity')?.value;
            const area = document.getElementById('propArea')?.value;
            const address = document.getElementById('propAddress')?.value;
            const contact = document.getElementById('propContact')?.value;
            const imageFiles = document.getElementById('propImages')?.files;

            if (!title || !description || !price || !type || !bedrooms || !bathrooms || !state || !city || !area || !address) {
                Utils.showNotification('Please fill in all property details', 'error');
                return;
            }

            try {
                Utils.showLoading();

                // Create property
                const propertyData = { title, description, price, type, bedrooms, bathrooms, state, city, area, address, contact };
                const property = await PropertyService.createProperty(propertyData);

                // Upload images if provided
                if (imageFiles && imageFiles.length > 0 && property && property.id) {
                    for (let i = 0; i < imageFiles.length; i++) {
                        try {
                            await PropertyService.uploadImage(imageFiles[i], property.id);
                        } catch (err) {
                            console.warn('Image upload failed:', err);
                        }
                    }
                }

                Utils.hideLoading();
                Utils.showNotification('Property created and uploaded successfully!', 'success');
                window.closeAddPropertyModal();

                // Refresh the listings page to show new property
                setTimeout(() => {
                    Router.navigate('listings');
                }, 1000);

            } catch (error) {
                Utils.hideLoading();
                console.error('Add property error:', error);
                if (error.message.includes('Upgrade') || error.message.includes('limit')) {
                    if (confirm(error.message + '\n\nClick OK to upgrade your account.')) {
                        Router.navigate('upgrade');
                    }
                } else {
                    Utils.showNotification('Failed to create property: ' + error.message, 'error');
                }
            }
            return false;
        };

        // Global search handler (overridden on listings page by Router.attachSearchHandlers)
        window.searchProperties = function () {
            if (window.Router && Router.loadListingsGrid) {
                Router.loadListingsGrid();
            }
        };

        window.requestVerificationCode = async function () {
            try {
                Utils.showLoading();
                await AuthService.requestEmailVerificationCode();
            } catch (e) {
                Utils.showNotification(e.message || 'Failed', 'error');
            } finally {
                Utils.hideLoading();
            }
        };

        window.submitEmailVerification = async function () {
            const input =
                document.getElementById('verifyPageCode') || document.getElementById('emailVerifyCodeInput');
            const code = input ? input.value : '';
            if (!code || code.length < 4) {
                Utils.showNotification('Enter the 6-digit code from your email', 'warning');
                return;
            }
            try {
                Utils.showLoading();
                await AuthService.verifyEmail(code);
                if (input) input.value = '';
                await AuthService.refreshProfile();
                const u = Utils.getCurrentUser();
                const ef = document.getElementById('kycEmailFlag');
                const ks = document.getElementById('kycStatusFlag');
                if (ef && u) ef.textContent = u.email_verified ? 'Verified' : 'Not verified';
                if (ks && u) ks.textContent = u.kyc_status || 'not_submitted';
                if (Router.currentPage === 'verify-email') {
                    Router.navigate('verify-email');
                }
            } catch (e) {
                Utils.showNotification(e.message || 'Verification failed', 'error');
            } finally {
                Utils.hideLoading();
            }
        };

        window.submitKycInfo = async function () {
            const t = document.getElementById('kycDocType');
            const idEl = document.getElementById('kycDocId');
            const docType = t ? t.value : '';
            const docId = idEl ? idEl.value : '';
            if (!docType || !docId) {
                Utils.showNotification('Select ID type and enter document number', 'warning');
                return;
            }
            try {
                Utils.showLoading();
                await AuthService.submitKyc(docType, docId);
                await AuthService.refreshProfile();
                const u = Utils.getCurrentUser();
                const ks = document.getElementById('kycStatusFlag');
                if (ks && u) ks.textContent = u.kyc_status || 'not_submitted';
            } catch (e) {
                Utils.showNotification(e.message || 'KYC failed', 'error');
            } finally {
                Utils.hideLoading();
            }
        };

        // Global like property handler
        window.likeProperty = async function (propertyId) {
            console.log('❤️ Liking property:', propertyId);
            if (!Utils.isAuthenticated()) {
                Utils.showNotification('Please login to like properties', 'warning');
                Router.navigate('login');
                return;
            }
            const result = await PropertyService.likeProperty(propertyId);
            // Refresh the property list to show updated likes
            if (result) {
                Router.renderListingsPage();
            }
        };

        // Global view property handler
        window.viewProperty = function (propertyId) {
            console.log('👀 Viewing property:', propertyId);
            Router.navigate(`property/${propertyId}`);
        };

        // Global delete property handler (landlord only)
        window.deleteProperty = async function (propertyId) {
            if (!confirm('Are you sure you want to delete this property? This cannot be undone.')) return;
            try {
                await PropertyService.deleteProperty(propertyId);
                Router.navigate('listings');
            } catch (e) {
                console.error('Delete failed', e);
            }
        };

        // Global delete property image handler (landlord only)
        window.deletePropertyImage = async function (propertyId, filename) {
            if (!confirm('Remove this image?')) return;
            try {
                await PropertyService.deletePropertyImage(propertyId, filename);
                Router.renderPropertyDetail();
            } catch (e) {
                console.error('Delete image failed', e);
            }
        };

        window.deletePropertyImageFromEl = function (btn) {
            const propertyId = btn.getAttribute('data-property-id');
            const filename = btn.getAttribute('data-filename');
            if (propertyId && filename) window.deletePropertyImage(parseInt(propertyId, 10), filename);
        };

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('🌐 Global error:', event.error);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });

        console.log('✅ Global event listeners added');
    }

    static showFatalError(error) {
        console.error('💥 FATAL ERROR:', error);

        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container" style="text-align: center; padding: 4rem 2rem;">
                    <div style="font-size: 4rem;">😵</div>
                    <h1 style="color: var(--secondary); margin: 1rem 0;">Something Went Wrong</h1>
                    <p style="color: var(--muted); margin-bottom: 2rem;">
                        We encountered a critical error while loading the application.
                    </p>
                    <div style="background: var(--glass); padding: 1.5rem; border-radius: var(--radius); margin: 2rem 0; text-align: left;">
                        <strong>Error Details:</strong>
                        <pre style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-top: 0.5rem; overflow: auto;">
${error ? error.toString() : 'Unknown error'}
                        </pre>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            🔄 Reload Page
                        </button>
                        <button class="btn btn-secondary" onclick="localStorage.clear(); window.location.reload()">
                            🧹 Clear Data & Reload
                        </button>
                    </div>
                    <div style="margin-top: 2rem; color: var(--muted); font-size: 0.9rem;">
                        <p>If the problem persists, please check the browser console for details.</p>
                    </div>
                </div>
            `;
        }
    }
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}

// Initialize the app when the script loads
console.log('📦 App script loaded, waiting for initialization...');

// Small delay to ensure all scripts are loaded
setTimeout(() => {
    App.init();
}, 100);

// Fallback initialization if something goes wrong
window.addEventListener('load', () => {
    console.log('📄 Window fully loaded');
    // Ensure app is initialized even if something missed
    if (!window.appInitialized) {
        console.log('🔄 Ensuring app initialization...');
        setTimeout(() => {
            if (!window.appInitialized) {
                console.log('⚡ Force-initializing app...');
                App.init();
            }
        }, 500);
    }
});

// Mark app as initialized when done
window.appInitialized = true;

console.log('✅ app.js loaded successfully - waiting for initialization');