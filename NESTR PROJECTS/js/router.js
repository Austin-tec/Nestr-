// Debug Router with Error Handling
console.log('Loading router.js...');

class Router {
    static currentPage = 'home';

    // Initialize router
    static init() {
        console.log('Router initializing...');

        try {
            // Handle hash changes
            window.addEventListener('hashchange', this.handleRoute.bind(this));

            // Handle initial load
            this.handleRoute();

            console.log('Router initialized successfully');
        } catch (error) {
            console.error('Router initialization error:', error);
        }
    }

    // Handle route changes
    static handleRoute() {
        try {
            const hash = window.location.hash.substring(1) || 'home';
            const [page] = hash.split('/');

            console.log('Navigating to:', page);
            this.currentPage = page;

            this.renderPage(page);
            this.updateNavigation();

            if (window.AuthService) {
                AuthService.updateNavigation();
            }
        } catch (error) {
            console.error('Route handling error:', error);
            this.renderErrorPage();
        }
    }

    // Navigate to specific page
    static navigate(path) {
        try {
            console.log('Navigating to path:', path);
            const newHash = '#' + path;
            if (window.location.hash === newHash) {
                this.handleRoute();
                return;
            }
            window.location.hash = path;
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }

    // Update navigation active states
    static updateNavigation() {
        try {
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href === `#${this.currentPage}`) {
                    link.classList.add('active');
                }
            });
        } catch (error) {
            console.error('Navigation update error:', error);
        }
    }

    // Render page based on route
    static renderPage(page) {
        try {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) {
                console.error('Main content element not found');
                return;
            }

            Utils.showLoading();

            switch (page) {
                case 'home':
                    this.renderHomePage();
                    break;
                case 'listings':
                    this.renderListingsPage();
                    break;
                case 'login':
                    this.renderLoginPage();
                    break;
                case 'signup':
                    this.renderSignupPage();
                    break;
                case 'verify-email':
                    this.renderVerifyEmailPage();
                    break;
                case 'tenant':
                    this.renderTenantDashboard();
                    break;
                case 'landlord':
                    this.renderLandlordDashboard();
                    break;
                case 'property':
                    this.renderPropertyDetail();
                    break;
                case 'upgrade':
                    this.renderUpgradePage();
                    break;
                case 'verify-payment':
                    this.renderVerifyPaymentPage();
                    break;
                default:
                    this.renderHomePage();
            }

            Utils.hideLoading();
        } catch (error) {
            console.error('Page rendering error:', error);
            this.renderErrorPage();
        }
    }

    // Render Home Page
    static async renderHomePage() {
        try {
            const mainContent = document.getElementById('main-content');
            const properties = await PropertyService.getProperties();
            const featuredProps = properties.slice(0, 3);

            mainContent.innerHTML = `
                <!-- Hero Section SaaS -->
                <section class="saas-hero stagger-in">
                    <div class="container saas-hero-container">
                        <div class="saas-hero-content">
                            <h1 class="saas-title">Finding your perfect<br><span style="background: linear-gradient(90deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block;">home.</span></h1>
                            <p class="saas-subtitle">The fastest, most energetic real estate platform in Nigeria. Instantly chat with verified landlords directly on WhatsApp.</p>
                            <div class="hero-actions saas-actions-grid">
                                <a href="https://wa.me/2348000000000?text=Hi%20Nestr,%20I'm%20looking%20for%20an%20apartment" target="_blank" class="btn btn-primary btn-large saas-pulse" style="display:flex; align-items:center; gap:0.5rem; width:fit-content; border-radius:50px;">
                                    <i class="fab fa-whatsapp"></i> Launch Bot
                                </a>
                                <button class="btn btn-secondary btn-large saas-hollow" onclick="Router.navigate('listings')" style="border-radius:50px; border-color:var(--primary);">
                                    Explore Grid
                                </button>
                            </div>
                        </div>
                        <div class="saas-hero-visual">
                            <div class="saas-wireframe-box" style="border-color:var(--primary); box-shadow:0px 20px 40px rgba(37,211,102,0.2);">
                                <img src="uuo.png" alt="Hero Interface" fetchpriority="high" decoding="async">
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Features Section -->
                <section class="features stagger-in" style="animation-delay: 0.2s;">
                    <div class="container">
                        <h2>Why Choose NESTR?</h2>
                        <div class="features-grid">
                            <div class="feature-card">
                                <div class="feature-icon"><a href="#"><img class="img-icons" loading="lazy" decoding="async" src="000.png" alt="listing-icon"></a></div>
                                <h3>Student-Focused</h3>
                                <p>Properties specifically for students near major universities</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon"><a href="#"><img class="img-icons" loading="lazy" decoding="async" src="00k.png" alt="listing-icon"></a></div>
                                <h3>Safe & Verified</h3>
                                <p>Direct contact with verified landlords, no agents</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon"><a href="#"><img class="img-icons" loading="lazy" decoding="async" src="222.png" alt="listing-icon"></a></div>
                                <h3>Budget-Friendly</h3>
                                <p>Affordable options for every student budget</p>
                            </div>
                        </div>
                    </div>
                </section>
                
<section id="analytics" class="section stagger-in" style="animation-delay: 0.4s;">
  <h2>Our Performance</h2>
  <p>We continue to improve our platform with transparency and real results. Here are a few statistics based on our service performance and user feedback.</p>

  <div class="analytics-container">
    <div class="circle-box">
      <svg class="progress" width="160" height="160">
        <circle cx="80" cy="80" r="70" stroke="#142c44" stroke-width="18" fill="none" />
        <circle cx="80" cy="80" r="70" stroke="#00d4ff" stroke-width="18" fill="none" stroke-dasharray="439" stroke-dashoffset="88" />
      </svg>
      <h3>80% Satisfaction</h3>
      <p>Tenant Success Rate</p>
    </div>

    <div class="circle-box">
      <svg class="progress" width="160" height="160">
        <circle cx="80" cy="80" r="70" stroke="#142c44" stroke-width="18" fill="none" />
        <circle cx="80" cy="80" r="70" stroke="#00ff85" stroke-width="18" fill="none" stroke-dasharray="439" stroke-dashoffset="66" />
      </svg>
      <h3>85% Verified</h3>
      <p>Trusted Listings</p>
    </div>

    <div class="circle-box">
      <svg class="progress" width="160" height="160">
        <circle cx="80" cy="80" r="70" stroke="#142c44" stroke-width="18" fill="none" />
        <circle cx="80" cy="80" r="70" stroke="#ffd000" stroke-width="18" fill="none" stroke-dasharray="439" stroke-dashoffset="110" />
      </svg>
      <h3>75% Faster</h3>
      <p>Communication Speed</p>
    </div>
  </div>
</section>

<section class="section">
  <h2>Why Choose Nestr?</h2>
  <p>We make renting stress-free. No more long searches, hidden fees, or fake listings. Nestr provides verified landlords, secure bookings, easy communication, and transparent pricing.</p>

  <div class="goals">
    <div class="goal-box">
    <a href="#"><img class="img-icons" loading="lazy" decoding="async" src="2.png" alt="listing-icon"></a>
      <h3>Verified Listings</h3>
      <p>All properties are checked to ensure authenticity and safety.</p>
    </div>
    <div class="goal-box">
        <a href="#"><img class="img-icons" loading="lazy" decoding="async" src="5.png" alt="listing-icon"></a>
      <h3>Secure Payments</h3>
      <p>Pay rent confidently with our protected transaction system.</p>
    </div>
    <div class="goal-box">
        <a href="#"><img class="img-icons" loading="lazy" decoding="async" src="333.png" alt="listing-icon"></a>
      <h3>Fast Communication</h3>
      <p>Reach landlords immediately and get real-time updates.</p>
    </div>
  </div>
</section>
</section>

<section id="types" class="section">
  <h2>Homes You Can Find on Nestr</h2>
  <p>From luxury apartments to affordable student lodges, Nestr gives you access to verified real estate options with images, pricing and location details set clearly.</p>
  <div class="home-types">
    <div class="home-card"><div class="img"></div><a href="#"><img class="img-icons" loading="lazy" decoding="async" src="99.png" alt="listing-icon"></a>
<h3>Luxury Apartments</h3><p>Comfortable spaces in top Nigerian cities with modern amenities.</p></div>
    <div class="home-card"><div class="img"><a href="#"><img class="img-icons" loading="lazy" decoding="async" src="3.png" alt="listing-icon"></a>
</div><h3>Shared Rooms</h3><p>Budget-friendly shared homes for students and young earners.</p></div>
    <div class="home-card"><div class="img"></div><a href="#"><img class="img-icons" loading="lazy" decoding="async" src="9.png" alt="listing-icon"></a>
<h3>Family Houses</h3><p>Spacious homes for families, fully documented and verified.</p></div>
  </div>
</section>

<section id="how" class="section">
  <h2 >How Nestr Works</h2>
  <div class="steps">
    <div class="step-box"><a href="#"><img class="img-icons" loading="lazy" decoding="async" src="4.png" alt="listing-icon"></a>
<h3>1. Explore Homes</h3><p>Browse verified listings with trusted reviews, clear prices and real photos.</p></div>
    <div class="step-box">    <a href="#"><img class="img-icons" loading="lazy" decoding="async" src="001.png" alt="listing-icon"></a>
<h3>2. Contact Landlord</h3><p>Use secure messaging to ask questions, negotiate or arrange inspection.</p></div>
    <div class="step-box">    <a href="#"><img class="img-icons" loading="lazy" decoding="async" src="8.png" alt="listing-icon"></a>
<h3>3. Book Securely</h3><p>Pay securely and receive instant confirmation & digital receipt.</p></div>
    <div class="step-box">    <a href="#"><img class="img-icons" loading="lazy" decoding="async" src="0.png" alt="listing-icon"></a>
<h3>4. Move In Easily</h3><p>Receive support and updates every step of the way.</p></div>
  </div>
</section>


<section id="cta-big" class="section stagger-in" style="animation-delay: 0.6s;">
  <div style="background: rgba(37, 211, 102, 0.05); border: 1px solid rgba(37, 211, 102, 0.2); padding: 4rem 2rem; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
      <h2 style="font-size: 3rem; margin-bottom: 1rem; line-height: 1.1;">Secure Your Next Home<br><span style="color: var(--primary);">Instantly.</span></h2>
      <p style="font-size: 1.2rem; color: #a1a1aa; margin-bottom: 2rem;">Stop waiting on agents. Chat directly with verified landlords and secure your housing fast.</p>
      <a href="https://wa.me/2348000000000?text=Hi%20Nestr,%20I'm%20ready%20to%20rent" target="_blank" class="btn btn-primary btn-large saas-pulse" style="display:inline-flex; align-items:center; gap:0.5rem; border-radius:50px;">
          <i class="fab fa-whatsapp" style="font-size: 1.5rem;"></i> Message Nestr Bot
      </a>
  </div>
</section>



            `;

            console.log('Home page rendered successfully');
        } catch (error) {
            console.error('Home page rendering error:', error);
            throw error;
        }
    }

    // Render Login Page
    static renderLoginPage() {
        try {
            const mainContent = document.getElementById('main-content');

            mainContent.innerHTML = `
                <div class="auth-container">
                    <div class="auth-card">
                        <div class="auth-header">
                            <h1>Welcome Back</h1>
                            <p>Sign in to your account</p>
                        </div>
                        
                        <form id="loginForm" onsubmit="handleLogin(event); return false;">
                            <div class="form-group">
                                <label for="loginEmail">Email Address</label>
                                <input 
                                    type="email" 
                                    id="loginEmail" 
                                    required 
                                    placeholder="your@email.com"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="loginPassword">Password</label>
                                <input 
                                    type="password" 
                                    id="loginPassword" 
                                    required 
                                    placeholder="Your password"
                                >
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-full">
                                Sign In
                            </button>
                        </form>
                        
                        <div class="auth-footer">
                            <p>Don't have an account? 
                                <a href="#signup" onclick="event.preventDefault(); Router.navigate('signup');">Sign up here</a>
                            </p>
                        </div>
                    </div>
                </div>
            `;

            console.log('Login page rendered successfully');
        } catch (error) {
            console.error('Login page rendering error:', error);
            throw error;
        }
    }

    // Render Signup Page
    static renderSignupPage() {
        try {
            const mainContent = document.getElementById('main-content');

            mainContent.innerHTML = `
                <div class="auth-container">
                    <div class="auth-card">
                        <div class="auth-header">
                            <h1>Create Account</h1>
                            <p>Join StudentRent today</p>
                        </div>
                        
                        <form id="signupForm" onsubmit="handleSignup(event); return false;">
                            <div class="form-group">
                                <label for="signupName">Full Name</label>
                                <input 
                                    type="text" 
                                    id="signupName" 
                                    required 
                                    placeholder="Your full name"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="signupEmail">Email Address</label>
                                <input 
                                    type="email" 
                                    id="signupEmail" 
                                    required 
                                    placeholder="your@email.com"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="signupPhone">Phone Number</label>
                                <input 
                                    type="tel" 
                                    id="signupPhone" 
                                    required 
                                    placeholder="+2348012345678"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="signupPassword">Password</label>
                                <input 
                                    type="password" 
                                    id="signupPassword" 
                                    required 
                                    placeholder="Create a password"
                                >
                            </div>
                            
                            <div class="form-group">
                                <select id="signupRole" required>
                                    <option value="">Select Role</option>
                                    <option value="tenant">TENANT</option>
                                    <option value="landlord">LANDLORD</option>
                                </select>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-full">
                                Create Account
                            </button>
                        </form>
                        
                        <div class="auth-footer">
                            <p>Already have an account? 
                                <a href="#login" onclick="Router.navigate('login')">Sign in here</a>
                            </p>
                        </div>
                    </div>
                </div>
            `;

            console.log('Signup page rendered successfully');
        } catch (error) {
            console.error('Signup page rendering error:', error);
            throw error;
        }
    }

    // Dedicated email verification (OTP)
    static renderVerifyEmailPage() {
        try {
            if (!Utils.isAuthenticated()) {
                this.navigate('login');
                return;
            }

            const mainContent = document.getElementById('main-content');
            const user = Utils.getCurrentUser();
            const verified =
                user &&
                (user.email_verified === true ||
                    user.email_verified === 'true' ||
                    user.email_verified === 't');

            if (verified) {
                mainContent.innerHTML = `
                <div class="auth-container">
                    <div class="auth-card verify-email-card">
                        <div class="auth-header">
                            <h1>Email verified</h1>
                            <p>Your email is confirmed.</p>
                        </div>
                        <button type="button" class="btn btn-primary btn-full" onclick="Router.navigate('${user.role === 'landlord' ? 'landlord' : 'tenant'
                    }')">
                            Go to dashboard
                        </button>
                    </div>
                </div>`;
                return;
            }

            mainContent.innerHTML = `
                <div class="auth-container">
                    <div class="auth-card verify-email-card">
                        <div class="auth-header">
                            <h1>Verify your email</h1>
                            <p>We sent a 6-digit code to <strong class="verify-email-strong">${Utils.escapeHtml(
                user.email || ''
            )}</strong>. Enter it below.</p>
                        </div>
                        <p class="verify-email-hint">Did not get an email? Check spam, or request a new code.</p>
                        <div class="form-group">
                            <label for="verifyPageCode">6-digit code</label>
                            <input type="text" id="verifyPageCode" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="one-time-code" placeholder="000000" class="verify-otp-input">
                        </div>
                        <button type="button" class="btn btn-primary btn-full" onclick="submitEmailVerification()">
                            Confirm email
                        </button>
                        <button type="button" class="btn btn-secondary btn-full verify-resend-btn" onclick="requestVerificationCode()">
                            Resend code
                        </button>
                        <div class="auth-footer verify-email-footer">
                            <a href="#" onclick="Router.navigate('${user.role === 'landlord' ? 'landlord' : 'tenant'}'); return false;">Back to dashboard</a>
                        </div>
                    </div>
                </div>`;

            AuthService.refreshProfile();
            console.log('Verify email page rendered');
        } catch (error) {
            console.error('Verify email page error:', error);
            throw error;
        }
    }

    // Render Tenant Dashboard
    static renderTenantDashboard() {
        try {
            if (!Utils.isAuthenticated() || !Utils.isTenant()) {
                this.navigate('login');
                return;
            }

            const user = Utils.getCurrentUser();
            const emailOk = user && (user.email_verified === true || user.email_verified === 'true' || user.email_verified === 't');
            if (!emailOk) {
                Utils.showNotification('Tenants must verify their email to access the dashboard.', 'warning');
                this.navigate('verify-email');
                return;
            }

            const mainContent = document.getElementById('main-content');

            mainContent.innerHTML = `
                <div class="container saas-dashboard-wrap">
                    <div class="dashboard-header">
                        <h1>Tenant Terminal</h1>
                        <p>Student Identity: ${Utils.escapeHtml(user.name)}</p>
                    </div>
                    
                    <div class="saas-metrics-row">
                        <div class="saas-metric-card">
                            <span class="saas-metric-num">0</span>
                            <span class="saas-metric-label">Feed Views</span>
                        </div>
                        <div class="saas-metric-card" style="border-color: var(--primary-dark);">
                            <span class="saas-metric-num text-blue" style="color: var(--primary-light);">0</span>
                            <span class="saas-metric-label">Saved Hooks</span>
                        </div>
                        <div class="saas-metric-card">
                            <span class="saas-metric-num">0</span>
                            <span class="saas-metric-label">Pings Made</span>
                        </div>
                    </div>

                    <div class="saas-terminal-panel">
                        <h2>System Execution Links</h2>
                        <div class="saas-quick-grid">
                            <button class="btn btn-primary dash-btn saas-pulse" onclick="Router.navigate('listings')">Load Real-time Feed</button>
                            <button class="btn btn-secondary dash-btn saas-hollow" onclick="Utils.showNotification('Metrics history logic disabled', 'info')">Activity Log</button>
                        </div>
                    </div>
                </div>
            `;

            console.log('Tenant dashboard rendered successfully');
        } catch (error) {
            console.error('Tenant dashboard rendering error:', error);
            throw error;
        }
    }

    // Render Landlord Dashboard
    static renderLandlordDashboard() {
        try {
            if (!Utils.isAuthenticated() || !Utils.isLandlord()) {
                this.navigate('login');
                return;
            }

            const user = Utils.getCurrentUser();
            const emailOk = user && (user.email_verified === true || user.email_verified === 'true' || user.email_verified === 't');
            if (!emailOk) {
                Utils.showNotification('Landlords must verify their email to access the dashboard.', 'warning');
                this.navigate('verify-email');
                return;
            }

            const mainContent = document.getElementById('main-content');

            mainContent.innerHTML = `
                <div class="container saas-dashboard-wrap" style="max-width: 1000px; margin: 0 auto; padding: 2rem 1rem;">
                    <div class="dashboard-header" style="margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">
                        <h1 style="font-size: 2rem; margin: 0;">Landlord Dashboard</h1>
                        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                            <p style="color: var(--primary-light); font-weight: 500; margin: 0; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-user-circle"></i> ${Utils.escapeHtml(user.name)}</p>
                            ${user.is_premium ? '<span style="background: linear-gradient(90deg, var(--primary), var(--secondary)); color: #000; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">Premium</span>' : '<span style="background: rgba(255,255,255,0.1); color: #ccc; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">Basic Tier</span>'}
                        </div>
                    </div>

                    ${!user.is_premium ? `
                    <div style="background: rgba(37, 211, 102, 0.05); border: 1px solid var(--primary); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <h3 style="color: var(--primary); margin-bottom: 0.5rem; font-size: 1.1rem;"><i class="fas fa-lock-open" style="margin-right: 0.5rem;"></i> Unlock Unlimited Listings</h3>
                            <p style="color: #a1a1aa; font-size: 0.95rem; margin: 0;">You can currently post up to 5 properties per week. Upgrade to remove this limit.</p>
                        </div>
                        <button class="btn btn-primary" onclick="Router.navigate('upgrade')" style="white-space: nowrap; padding: 0.8rem 1.5rem; border-radius: 50px;">Upgrade Now</button>
                    </div>
                    ` : ''}
                    
                    <div class="saas-metrics-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                        <div class="saas-metric-card" style="background: var(--darker); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center;">
                            <span class="saas-metric-num" style="font-size: 2.5rem; font-weight: bold; color: var(--primary);">0</span>
                            <span class="saas-metric-label" style="color: #a1a1aa; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Active Listings</span>
                        </div>
                        <div class="saas-metric-card" style="background: var(--darker); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center;">
                            <span class="saas-metric-num" style="font-size: 2.5rem; font-weight: bold; color: #fff;">0</span>
                            <span class="saas-metric-label" style="color: #a1a1aa; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Total Views</span>
                        </div>
                        <div class="saas-metric-card" style="background: var(--darker); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center;">
                            <span class="saas-metric-num" style="font-size: 2.5rem; font-weight: bold; color: #fff;">0</span>
                            <span class="saas-metric-label" style="color: #a1a1aa; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Tenant Pings</span>
                        </div>
                    </div>

                    <div class="saas-terminal-panel" style="background: var(--darker); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 2rem;">
                        <h2 style="font-size: 1.5rem; margin-bottom: 1.5rem; color: #fff;">Property Management</h2>
                        <div class="saas-quick-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                            <button class="btn btn-primary dash-btn saas-pulse" onclick="showAddPropertyModal()" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; border-radius: 12px; font-size: 1.1rem;"><i class="fas fa-plus"></i> Post New Property</button>
                            <button class="btn btn-secondary dash-btn saas-hollow" onclick="Router.navigate('listings')" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; border-radius: 12px; font-size: 1.1rem; border: 1px solid rgba(255,255,255,0.2);"><i class="fas fa-th-list"></i> Manage My Properties</button>
                        </div>
                    </div>
                    
                    <div id="addPropertyModal" class="modal modal-upload" style="display: none;">
                        <div class="modal-content modal-upload-inner">
                            <div class="modal-header modal-upload-header">
                                <div>
                                    <h2>List a property</h2>
                                    <p class="modal-lead">Details appear on Browse as soon as the listing is created.</p>
                                </div>
                                <button type="button" class="close-btn" onclick="closeAddPropertyModal()" aria-label="Close">&times;</button>
                            </div>
                            
                            <form id="addPropertyForm" class="form-upload-property" onsubmit="handleAddProperty(event); return false;">
                                <div class="form-grid-upload">
                                    <div class="form-group form-span-2">
                                        <label for="propTitle">Title</label>
                                        <input type="text" id="propTitle" required placeholder="e.g. Quiet 2-bed near campus">
                                    </div>
                                    <div class="form-group form-span-2">
                                        <label for="propDescription">Description</label>
                                        <textarea id="propDescription" required placeholder="What makes this place great?"></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="propPrice">Monthly (NGN)</label>
                                        <input type="number" id="propPrice" required min="0" placeholder="180000">
                                    </div>
                                    <div class="form-group">
                                        <label for="propType">Type</label>
                                        <select id="propType" required>
                                            <option value="">Select</option>
                                            <option value="apartment">Apartment</option>
                                            <option value="house">House</option>
                                            <option value="shared">Shared room</option>
                                            <option value="studio">Studio</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="propBedrooms">Bedrooms</label>
                                        <input type="number" id="propBedrooms" required min="0" placeholder="2">
                                    </div>
                                    <div class="form-group">
                                        <label for="propBathrooms">Bathrooms</label>
                                        <input type="number" id="propBathrooms" required min="0" placeholder="1">
                                    </div>
                                    <div class="form-group">
                                        <label for="propState">State</label>
                                        <input type="text" id="propState" required placeholder="e.g. Edo">
                                    </div>
                                    <div class="form-group">
                                        <label for="propCity">City</label>
                                        <input type="text" id="propCity" required placeholder="e.g. Benin City">
                                    </div>
                                    <div class="form-group">
                                        <label for="propArea">Area</label>
                                        <input type="text" id="propArea" required placeholder="e.g. Ugbowo">
                                    </div>
                                    <div class="form-group form-span-2">
                                        <label for="propAddress">Full address</label>
                                        <input type="text" id="propAddress" required placeholder="Street, landmark">
                                    </div>
                                    <div class="form-group form-span-2">
                                        <label for="propContact">Contact phone</label>
                                        <input type="tel" id="propContact" required placeholder="+2348012345678">
                                    </div>
                                    <div class="form-group form-span-2 upload-images-block">
                                        <label for="propImages">Photos</label>
                                        <input type="file" id="propImages" multiple accept="image/*" onchange="handleImageUpload(event)">
                                        <div id="imagePreview" class="image-preview-row"></div>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary btn-full btn-upload-submit">Publish listing</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            AuthService.refreshProfile().then(() => {
                const u = Utils.getCurrentUser();
                const ef = document.getElementById('kycEmailFlag');
                const ks = document.getElementById('kycStatusFlag');
                if (ef && u) ef.textContent = u.email_verified ? 'Verified' : 'Not verified';
                if (ks && u) ks.textContent = u.kyc_status || 'not_submitted';
            });

            console.log('Landlord dashboard rendered successfully');
        } catch (error) {
            console.error('Landlord dashboard rendering error:', error);
            throw error;
        }
    }

    // Render Upgrade Paywall Page
    static renderUpgradePage() {
        const mainContent = document.getElementById('main-content');
        if (!Utils.isAuthenticated() || !Utils.isLandlord()) {
            this.navigate('login');
            return;
        }

        mainContent.innerHTML = `
            <div class="container" style="padding: 4rem 1rem;">
                <div style="text-align: center; margin-bottom: 3rem;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #fff;">Upgrade to <span style="background: linear-gradient(90deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Premium Landlord</span></h1>
                    <p style="color: #a1a1aa; font-size: 1.1rem; max-width: 600px; margin: 0 auto;">You've reached your free limit of 5 listings. Upgrade to unlock unlimited potential and reach thousands of students instantly.</p>
                </div>
                
                <div class="pricing-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; max-width: 900px; margin: 0 auto; align-items: stretch;">
                    
                    <!-- Monthly Plan -->
                    <div class="pricing-card" style="background: var(--darker); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 2.5rem; text-align: center; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <h3 style="color: #a1a1aa; font-size: 1.2rem; margin-bottom: 1rem;">Monthly</h3>
                        <div style="font-size: 3rem; font-weight: 700; color: #fff; margin-bottom: 1.5rem;">₦9,000<span style="font-size: 1rem; color: #666;">/mo</span></div>
                        <ul style="list-style: none; padding: 0; margin: 0 0 2rem 0; text-align: left; color: #ccc;">
                            <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-check" style="color: var(--primary);"></i> Unlimited property listings</li>
                            <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-check" style="color: var(--primary);"></i> Priority email support</li>
                            <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-check" style="color: var(--primary);"></i> Premium verified badge</li>
                        </ul>
                        <button class="btn btn-secondary btn-full" style="margin-top: auto; border: 1px solid var(--primary); padding: 1rem;" onclick="handleUpgrade('monthly')">Choose Monthly</button>
                    </div>

                    <!-- Annual Plan -->
                    <div class="pricing-card" style="background: rgba(37, 211, 102, 0.05); border: 2px solid var(--primary); border-radius: 20px; padding: 2.5rem; text-align: center; display: flex; flex-direction: column; position: relative; box-shadow: 0 10px 40px rgba(37, 211, 102, 0.15);">
                        <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: var(--primary); color: #000; padding: 0.3rem 1rem; border-radius: 20px; font-weight: bold; font-size: 0.85rem; letter-spacing: 1px;">BEST VALUE</div>
                        <h3 style="color: var(--primary-light); font-size: 1.2rem; margin-bottom: 1rem;">Annually</h3>
                        <div style="font-size: 3rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">₦45,000<span style="font-size: 1rem; color: #666;">/yr</span></div>
                        <p style="color: var(--secondary); font-size: 0.9rem; margin-bottom: 1.5rem; font-weight: bold;">Save ₦63,000 immediately!</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 2rem 0; text-align: left; color: #ccc;">
                            <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-check" style="color: var(--primary);"></i> Everything in Monthly</li>
                            <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-check" style="color: var(--primary);"></i> Top of feed ranking</li>
                            <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-check" style="color: var(--primary);"></i> 24/7 WhatsApp concierge</li>
                        </ul>
                        <button class="btn btn-primary btn-full saas-pulse" style="margin-top: auto; padding: 1rem; font-size: 1.1rem;" onclick="handleUpgrade('annual')">Choose Annual</button>
                    </div>

                </div>
            </div>
        `;
    }

    static renderVerifyPaymentPage() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="container" style="padding: 10rem 1rem; text-align: center;">
                <div class="loading-spinner" style="margin: 0 auto 2rem auto; width: 50px; height: 50px; border-width: 4px;"></div>
                <h2>Verifying Payment...</h2>
                <p style="color: #a1a1aa; margin-top: 1rem;">Please wait while we confirm your transaction securely.</p>
            </div>
        `;

        const urlParams = new URLSearchParams(window.location.search);
        let reference = urlParams.get('reference') || urlParams.get('trxref');
        
        if (!reference) {
            const hashParts = window.location.hash.split('?');
            if (hashParts.length > 1) {
                const hashParams = new URLSearchParams(hashParts[1]);
                reference = hashParams.get('reference') || hashParams.get('trxref');
            }
        }

        if (!reference) {
            Utils.showNotification('Payment reference not found.', 'error');
            this.navigate('landlord');
            return;
        }

        const token = localStorage.getItem('user_token');
        fetch('/api/paystack/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reference: reference })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Utils.showNotification('Payment successful! Your account is now Premium.', 'success');
                AuthService.refreshProfile().then(() => {
                    Router.navigate('landlord');
                });
            } else {
                throw new Error(data.error || 'Payment verification failed');
            }
        })
        .catch(err => {
            console.error('Verify error:', err);
            Utils.showNotification(err.message, 'error');
            setTimeout(() => Router.navigate('landlord'), 3000);
        });
    }

    static _readListingFiltersFromDom() {
        const g = (id) => {
            const el = document.getElementById(id);
            return el ? String(el.value || '').trim() : '';
        };
        return {
            search: g('searchInput'),
            state: g('filterState'),
            city: g('filterCity'),
            area: g('filterArea'),
            type: g('filterType'),
            minPrice: g('filterMinPrice'),
            maxPrice: g('filterMaxPrice'),
            bedrooms: g('filterBedrooms')
        };
    }

    static async loadListingsGrid() {
        const filters = Router._readListingFiltersFromDom();
        const grid = document.getElementById('properties-grid');
        const count = document.getElementById('properties-count');
        if (!grid || !count) return;
        grid.innerHTML = '<div class="loading-spinner">Loading properties...</div>';
        const properties = await PropertyService.getProperties(filters);
        count.textContent = `${properties.length} Properties Found`;
        grid.innerHTML = Router.renderPropertiesGrid(properties);
    }

    // Render Listings Page
    static async renderListingsPage() {
        try {
            const mainContent = document.getElementById('main-content');

            mainContent.innerHTML = `
                <div class="container">
                    <div class="page-header">
                        <h1>Browse Properties</h1>
                        <p>Find your perfect student accommodation</p>
                    </div>

                    <div class="search-filters listings-filters-panel">
                        <div class="search-box">
                            <input type="text" id="searchInput" placeholder="Search title, address, area, city, state..." class="search-input">
                            <button type="button" class="btn btn-primary" onclick="searchProperties()">Search</button>
                        </div>
                        <div class="filter-grid">
                            <input type="text" id="filterState" class="filter-input" placeholder="State (exact, e.g. Edo)" autocomplete="address-level1">
                            <input type="text" id="filterCity" class="filter-input" placeholder="City (exact match)" autocomplete="address-level2">
                            <input type="text" id="filterArea" class="filter-input" placeholder="Area (contains)" autocomplete="off">
                            <select id="filterType" class="filter-select">
                                <option value="">All types</option>
                                <option value="apartment">Apartment</option>
                                <option value="house">House</option>
                                <option value="shared">Shared room</option>
                                <option value="studio">Studio</option>
                            </select>
                            <input type="number" id="filterMinPrice" class="filter-input" placeholder="Min price" min="0">
                            <input type="number" id="filterMaxPrice" class="filter-input" placeholder="Max price" min="0">
                            <input type="number" id="filterBedrooms" class="filter-input" placeholder="Min bedrooms" min="0">
                        </div>
                        <div class="filter-actions">
                            <button type="button" class="btn btn-secondary btn-small" onclick="clearListingFilters()">Clear filters</button>
                        </div>
                    </div>

                    <div class="properties-section">
                        <div class="properties-header">
                            <h3 id="properties-count">Loading properties...</h3>
                        </div>
                        
                        <div class="properties-grid" id="properties-grid">
                            <div class="loading-spinner">Loading properties...</div>
                        </div>
                    </div>
                </div>
            `;

            await Router.loadListingsGrid();

            this.attachSearchHandlers();
            console.log('Listings page rendered successfully');
        } catch (error) {
            console.error('Listings page rendering error:', error);
            throw error;
        }
    }

    // Helper method to render properties grid
    static renderPropertiesGrid(properties) {
        try {
            if (!properties || properties.length === 0) {
                return `
                    <div class="empty-state">
                        <div class="empty-icon">🏠</div>
                        <h3>No properties found</h3>
                        <p>Try adjusting your search filters</p>
                    </div>
                `;
            }

            const user = Utils.getCurrentUser();
            return properties.map(property => {
                const imageUrl = property.images && property.images.length > 0
                    ? `/nestr%20images/${encodeURIComponent(property.images[0])}`
                    : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2240%22%3E🏠%3C/text%3E%3C/svg%3E';
                const isOwner = user && user.role === 'landlord' && property.landlord_id === user.id;
                const deleteBtn = isOwner ? `<button type="button" class="btn btn-small" style="font-size:0.8rem; padding:0.25rem 0.5rem;" onclick="event.stopPropagation(); deleteProperty(${property.id})" title="Delete property">🗑️</button>` : '';

                return `
                <div class="property-card">
                    <div class="property-image">
                        <img src="${imageUrl}" alt="${Utils.escapeHtml(property.title)}" width="400" height="200" loading="lazy" decoding="async" style="width:100%; height:200px; object-fit:cover; border-radius:8px 8px 0 0;">
                        <div class="property-badge">${Utils.formatPrice(property.price)}/month</div>
                    </div>
                    <div class="property-content">
                        <h3 class="property-title">${Utils.escapeHtml(property.title)}</h3>
                        <p class="property-location">
                            📍 ${Utils.escapeHtml(property.area)}, ${Utils.escapeHtml(property.city)}${property.state ? ', ' + Utils.escapeHtml(property.state) : ''}
                        </p>
                        <div class="property-features">
                            <span>🛏️ ${property.bedrooms} bed</span>
                            <span>🚿 ${property.bathrooms} bath</span>
                            <span>${property.type}</span>
                        </div>
                        <div class="property-actions">
                            ${deleteBtn}
                            <button class="btn-like" onclick="event.stopPropagation(); likeProperty(${property.id})">
                                ❤️ ${property.likes?.length || 0}
                            </button>
                            <a href="https://wa.me/${Utils.escapeHtml(property.contact || '2348000000000')}?text=I'm%20interested%20in%20${encodeURIComponent(property.title)}" class="btn btn-primary btn-small saas-pulse" target="_blank" onclick="event.stopPropagation();" style="border-radius:50px; font-weight:700; display:flex; align-items:center; gap:0.25rem;">
                                <i class="fab fa-whatsapp"></i> Chat
                            </a>
                            <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); viewProperty(${property.id})" style="border-radius:50px;">
                                Details
                            </button>
                        </div>
                    </div>
                </div>
            `}).join('');
        } catch (error) {
            console.error('Properties grid rendering error:', error);
            return '<div class="error">Error loading properties</div>';
        }
    }

    // Attach search handlers
    static attachSearchHandlers() {
        try {
            window.searchProperties = Utils.debounce(async function () {
                await Router.loadListingsGrid();
            }, 300);

            window.clearListingFilters = function () {
                const ids = ['searchInput', 'filterState', 'filterCity', 'filterArea', 'filterType', 'filterMinPrice', 'filterMaxPrice', 'filterBedrooms'];
                ids.forEach((id) => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                Router.loadListingsGrid();
            };

            ['filterType', 'filterMinPrice', 'filterMaxPrice', 'filterBedrooms'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('change', () => Router.loadListingsGrid());
                }
            });
            ['filterState', 'filterCity', 'filterArea'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener(
                        'input',
                        Utils.debounce(() => Router.loadListingsGrid(), 400)
                    );
                }
            });

            // Do not overwrite existing global like/view handlers if provided
            if (!window.likeProperty) {
                window.likeProperty = async function (propertyId) {
                    if (!Utils.isAuthenticated()) {
                        Router.navigate('login');
                        return;
                    }
                    try {
                        await PropertyService.likeProperty(propertyId);
                        // Re-render listings to show updated like counts
                        Router.renderListingsPage();
                    } catch (err) {
                        console.error('Like action failed', err);
                        Utils.showNotification('Failed to like property', 'error');
                    }
                };
            }

            if (!window.viewProperty) {
                window.viewProperty = function (propertyId) {
                    Router.navigate(`property/${propertyId}`);
                };
            }
        } catch (error) {
            console.error('Search handlers attachment error:', error);
        }
    }

    // Render individual property detail page
    static async renderPropertyDetail() {
        try {
            const mainContent = document.getElementById('main-content');
            const hash = window.location.hash.substring(1) || '';
            const parts = hash.split('/');
            const id = parts[1];
            if (!id) {
                this.navigate('listings');
                return;
            }

            Utils.showLoading();
            const property = await PropertyService.getPropertyById(id);
            if (!property) {
                mainContent.innerHTML = '<div class="container"><h3>Property not found</h3></div>';
                Utils.hideLoading();
                return;
            }

            const user = Utils.getCurrentUser();
            const isOwner = user && user.role === 'landlord' && property.landlord_id === user.id;
            const imagesHtml = (property.images || []).map((img, idx) => {
                const url = `/nestr%20images/${encodeURIComponent(img)}`;
                const safeFilename = String(img).replace(/"/g, '&quot;');
                const loadAttr = idx === 0 ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
                const deleteBtn = isOwner ? `<button type="button" class="btn btn-small" style="margin-left:8px; font-size:0.85rem;" data-property-id="${property.id}" data-filename="${safeFilename}" onclick="deletePropertyImageFromEl(this)">Remove image</button>` : '';
                return `<div style="margin-bottom:1rem;"><img src="${url}" style="max-width:100%; border-radius:8px; margin-bottom:4px;" ${loadAttr}><br>${deleteBtn}</div>`;
            }).join('');

            const deletePropertyBtn = isOwner ? `<button class="btn" style="background:#c00; color:#fff;" onclick="deleteProperty(${property.id})">🗑️ Delete property</button>` : '';

            mainContent.innerHTML = `
                <div class="container">
                    <div class="property-detail">
                        <h1>${Utils.escapeHtml(property.title)}</h1>
                        <div class="property-media">${imagesHtml}</div>
                        <div class="property-meta">
                            <p><strong>Price:</strong> ${Utils.formatPrice(property.price)}/month</p>
                            <p><strong>Location:</strong> ${Utils.escapeHtml(property.area)}, ${Utils.escapeHtml(property.city)}${property.state ? ', ' + Utils.escapeHtml(property.state) : ''}</p>
                            <p><strong>Bedrooms:</strong> ${property.bedrooms} · <strong>Bathrooms:</strong> ${property.bathrooms}</p>
                            <p>${Utils.escapeHtml(property.description)}</p>
                            <p><strong>Listed by:</strong> ${Utils.escapeHtml(property.landlord_name || 'Landlord')}</p>
                            <p><strong>Contact:</strong> <a href="tel:${Utils.escapeHtml(property.contact || '')}">${Utils.escapeHtml(property.contact || 'Not provided')}</a></p>
                            <div style="margin-top:1rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
                                <a href="https://wa.me/${Utils.escapeHtml(property.contact || '2348000000000')}?text=I'm%20interested%20in%20${encodeURIComponent(property.title)}" target="_blank" class="btn btn-primary saas-pulse" style="border-radius:50px; display:flex; align-items:center; gap:0.5rem;">
                                    <i class="fab fa-whatsapp"></i> Chat on WhatsApp
                                </a>
                                <button class="btn btn-secondary" onclick="likeProperty(${property.id})" style="border-radius:50px;">❤️ ${property.likes?.length || 0}</button>
                                <button class="btn" onclick="Router.navigate('listings')" style="border-radius:50px;">⬅ Back</button>
                                ${deletePropertyBtn}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            Utils.hideLoading();
        } catch (error) {
            console.error('Property detail render error:', error);
            this.renderErrorPage();
        }
    }

    // Render error page
    static renderErrorPage() {
        try {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="container">
                        <div class="error-page">
                            <h1>😕 Something went wrong</h1>
                            <p>We're having trouble loading the page. Please try refreshing.</p>
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                Refresh Page
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error page rendering error:', error);
        }
    }
}

// Make Router available globally
window.Router = Router;
console.log('Router loaded successfully');
