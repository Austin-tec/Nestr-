// Enhanced Authentication Service with Backend API Integration
console.log('Loading auth.js...');

class AuthService {
    static init() {
        console.log('AuthService initialized');
        this.updateNavigation();

        let idleTime = 0;
        setInterval(() => {
            if (!localStorage.getItem('user_token')) return;
            idleTime += 15;
            if (idleTime >= 240) {
                localStorage.removeItem('user_token');
                if (window.Utils) Utils.removeCurrentUser();
                this.updateNavigation();
                if (window.Utils) Utils.showNotification('Session expired due to inactivity. Please log back in.', 'warning');
                if (window.Router) Router.navigate('login');
            }
        }, 15000);

        ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
            document.addEventListener(evt, () => { idleTime = 0; });
        });
    }

    // Login user
    static async login(email, password) {
        try {
            Utils.showLoading();

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store user and token
            localStorage.setItem('user_token', data.token);
            Utils.setCurrentUser(data.user);

            Utils.showNotification('Login successful!', 'success');
            this.updateNavigation();
            return data.user;
        } catch (error) {
            console.error('Login error:', error);
            Utils.showNotification(error.message, 'error');
            return null;
        } finally {
            Utils.hideLoading();
        }
    }

    // Register new user
    static async register(userData) {
        try {
            Utils.showLoading();

            // Validate data
            if (!Utils.validateEmail(userData.email)) {
                throw new Error('Please enter a valid email address');
            }

            if (!Utils.validatePhone(userData.phone)) {
                throw new Error('Please enter a valid Nigerian phone number');
            }

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store user and token
            localStorage.setItem('user_token', data.token);
            Utils.setCurrentUser(data.user);

            Utils.showNotification('Account created successfully!', 'success');
            if (data.verification) {
                if (data.verification.email_sent) {
                    Utils.showNotification('Check your email (and spam folder) for your 6-digit verification code.', 'success');
                } else if (data.verification.code) {
                    Utils.showNotification(`Dev mode: your code is ${data.verification.code}`, 'info');
                }
            }
            this.updateNavigation();
            return data.user;
        } catch (error) {
            console.error('Registration error:', error);
            Utils.showNotification(error.message, 'error');
            return null;
        } finally {
            Utils.hideLoading();
        }
    }

    // Refresh profile from server (verification level, KYC, etc.)
    static async refreshProfile() {
        try {
            const token = localStorage.getItem('user_token');
            if (!token) return null;
            const response = await fetch('/api/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load profile');
            }
            if (data.user) {
                Utils.setCurrentUser(data.user);
                this.updateNavigation();
            }
            return data.user || null;
        } catch (e) {
            console.error('refreshProfile', e);
            return null;
        }
    }

    static async requestEmailVerificationCode() {
        const token = localStorage.getItem('user_token');
        if (!token) throw new Error('Not logged in');
        const response = await fetch('/api/auth/request-email-verification', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not request code');
        if (data.already_verified) {
            Utils.showNotification('Email is already verified.', 'info');
            return data;
        }
        if (data.email_sent) {
            Utils.showNotification('Check your email (and spam folder) for the 6-digit code.', 'success');
        } else if (data.code) {
            Utils.showNotification(`Dev mode — your code: ${data.code}`, 'success');
        } else {
            Utils.showNotification('Code issued. Configure SMTP to receive email.', 'info');
        }
        return data;
    }

    static async verifyEmail(code) {
        const token = localStorage.getItem('user_token');
        if (!token) throw new Error('Not logged in');
        const response = await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ code: String(code).trim() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Verification failed');
        if (data.user) Utils.setCurrentUser(data.user);
        Utils.showNotification('Email verified', 'success');
        this.updateNavigation();
        return data.user;
    }

    static async submitKyc(docType, docId) {
        const token = localStorage.getItem('user_token');
        if (!token) throw new Error('Not logged in');
        const response = await fetch('/api/landlord/kyc/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                doc_type: String(docType).trim(),
                doc_id: String(docId).trim()
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'KYC submit failed');
        if (data.user) Utils.setCurrentUser(data.user);
        Utils.showNotification('KYC submitted for review', 'success');
        this.updateNavigation();
        return data.user;
    }

    static verificationLabel(level) {
        const l = (level || 'basic').toLowerCase();
        if (l === 'solid') return 'Solid';
        if (l === 'verified') return 'Email verified';
        return 'Basic';
    }

    // Logout user
    static logout() {
        try {
            localStorage.removeItem('user_token');
            Utils.removeCurrentUser();
            Utils.showNotification('Logged out successfully', 'info');
            this.updateNavigation();
            if (window.Router) {
                Router.navigate('/');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Update navigation based on auth state
    static updateNavigation() {
        try {
            const navAuth = document.getElementById('navAuth');
            if (!navAuth) {
                console.warn('navAuth element not found');
                return;
            }

            const user = Utils.getCurrentUser();

            if (user) {
                const vLevel = user.verification_level || 'basic';
                const badge =
                    user.role === 'landlord'
                        ? `<span class="verify-badge verify-${Utils.escapeHtml(vLevel)}" title="Verification level">${Utils.escapeHtml(
                            AuthService.verificationLabel(vLevel)
                        )}</span>`
                        : '';
                navAuth.innerHTML = `
                    <div class="user-menu">
                        <span class="user-greeting">Hello, ${Utils.escapeHtml(user.name)}</span>
                        ${badge}
                        <div class="dropdown">
                            <button class="dropdown-toggle">
                                👤
                            </button>
                            <div class="dropdown-menu">
                                <a href="#${user.role}" class="dropdown-item">Dashboard</a>
                                <a href="#profile" class="dropdown-item">Profile</a>
                                <button onclick="AuthService.logout()" class="dropdown-item">Logout</button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                navAuth.innerHTML = `
                    <a href="#login" class="nav-link">Login</a>
                    <a href="#signup" class="btn btn-primary" onclick="event.preventDefault(); Router.navigate('signup');">Sign Up</a>
                `;
            }
        } catch (error) {
            console.error('Error updating navigation:', error);
        }
    }
}

// Make AuthService available globally
window.AuthService = AuthService;
console.log('AuthService loaded successfully');