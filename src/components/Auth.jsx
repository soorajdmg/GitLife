import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import { Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';

import img1 from '../assets/images/login-1.jpg';
import img2 from '../assets/images/login-2.png';
import img3 from '../assets/images/login-3.png';
import img4 from '../assets/images/login-4.png';
import img5 from '../assets/images/login-5.png';
import './Auth.css';

const SLIDES = [
  { img: img1, caption: 'Your journey, one commit at a time' },
  { img: img2, caption: 'Branch into new possibilities' },
  { img: img3, caption: 'Explore paths not yet taken' },
  { img: img4, caption: 'Merge your best decisions' },
  { img: img5, caption: 'Track your life\'s impact' },
];

/* ─── GitLife Logo SVG ─── */
function GitLifeLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="oklch(52% 0.2 260)" />
      <line x1="10" y1="6" x2="10" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M10 11 C10 11 10 8 18 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="19" r="2.5" fill="white" />
      <circle cx="10" cy="11" r="2.5" fill="white" />
      <circle cx="18" cy="8" r="2.5" fill="white" opacity="0.7" />
    </svg>
  );
}

/* ─── Google Icon ─── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Step indicator ─── */
function StepDots({ step }) {
  return (
    <div className="auth-step-dots">
      {[1, 2, 3].map(s => (
        <div key={s} className={`auth-step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`} />
      ))}
    </div>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  // Signup multi-step state
  const [step, setStep] = useState(1); // 1=email+name, 2=username, 3=password
  const [signupData, setSignupData] = useState({ email: '', fullName: '', username: '', password: '', confirmPassword: '' });
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameMsg, setUsernameMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideFading, setSlideFading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const usernameCheckTimer = useRef(null);

  /* ─── Handle Google OAuth callback on mount ─── */
  useEffect(() => {
    if (window.location.pathname === '/auth/google/callback') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      if (errorParam) {
        setError('Google sign-in was cancelled or failed.');
        window.history.replaceState({}, '', '/');
        return;
      }

      if (code) {
        setLoading(true);
        loginWithGoogle(code)
          .then(() => {
            window.history.replaceState({}, '', '/');
          })
          .catch((err) => {
            setError(err.message || 'Google sign-in failed. Please try again.');
            window.history.replaceState({}, '', '/');
          })
          .finally(() => setLoading(false));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Auto-advance carousel ─── */
  const goToSlide = useCallback((idx) => {
    setSlideFading(true);
    setTimeout(() => {
      setSlideIndex(idx);
      setSlideFading(false);
    }, 350);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((slideIndex + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slideIndex, goToSlide]);

  /* ─── Username availability check ─── */
  const checkUsername = useCallback((value) => {
    clearTimeout(usernameCheckTimer.current);
    if (!value || value.length < 3) {
      setUsernameStatus(value ? 'invalid' : null);
      setUsernameMsg(value ? 'At least 3 characters required' : '');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setUsernameStatus('invalid');
      setUsernameMsg('Only letters, numbers, _ and - allowed');
      return;
    }
    setUsernameStatus('checking');
    setUsernameMsg('');
    usernameCheckTimer.current = setTimeout(async () => {
      try {
        const res = await api.checkUsername(value);
        if (res && typeof res.available === 'boolean') {
          setUsernameStatus(res.available ? 'available' : 'taken');
          setUsernameMsg(res.available ? 'Username is available!' : 'Username is already taken');
        } else {
          setUsernameStatus(null);
          setUsernameMsg('');
        }
      } catch {
        setUsernameStatus(null);
        setUsernameMsg('');
      }
    }, 500);
  }, []);

  useEffect(() => () => clearTimeout(usernameCheckTimer.current), []);

  /* ─── Handlers ─── */
  const handleLoginChange = (e) => {
    setLoginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
    setError('');
    if (name === 'username') checkUsername(value);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!signupData.email || !signupData.fullName.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleStep2Next = (e) => {
    e.preventDefault();
    if (usernameStatus === 'taken') {
      setError('Username is already taken');
      return;
    }
    if (usernameStatus === 'invalid' || !signupData.username || signupData.username.length < 3) {
      setError('Please choose a valid username');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError('');
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      await register(signupData.email, signupData.fullName, signupData.username, signupData.password);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(p => !p);
    setError('');
    setStep(1);
    setLoginData({ email: '', password: '' });
    setSignupData({ email: '', fullName: '', username: '', password: '', confirmPassword: '' });
    setUsernameStatus(null);
    setUsernameMsg('');
  };

  const handleGoogleAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google sign-in is not configured. Please use email/password.');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&prompt=select_account`;
    window.location.href = url;
  };

  const currentSlide = SLIDES[slideIndex];

  /* ─── Username status icon ─── */
  const UsernameStatusIcon = () => {
    if (usernameStatus === 'checking') return <Loader size={15} className="auth-username-icon checking" />;
    if (usernameStatus === 'available') return <CheckCircle size={15} className="auth-username-icon available" />;
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return <XCircle size={15} className="auth-username-icon taken" />;
    return null;
  };

  return (
    <div className="auth-page">
      {/* ── Left image panel ── */}
      <div className="auth-image-panel">
        <img
          key={slideIndex}
          src={currentSlide.img}
          alt="GitLife visual"
          className={`auth-slide-img ${slideFading ? 'auth-slide-fading' : 'auth-slide-visible'}`}
        />
        <div className="auth-image-overlay" />
        <div className="auth-image-logo">
          <GitLifeLogo size={28} />
          <span>GitLife</span>
        </div>
        <div className="auth-image-caption">
          <p className={slideFading ? 'auth-caption-fading' : 'auth-caption-visible'}>
            {currentSlide.caption}
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <GitLifeLogo size={22} />
            <span>GitLife</span>
          </div>

          {isLogin ? (
            /* ════ LOGIN FORM ════ */
            <>
              <h1 className="auth-form-heading">Welcome back</h1>
              <p className="auth-form-subheading">Sign in to continue your journey</p>

              <button type="button" className="auth-google-btn" onClick={handleGoogleAuth}>
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <div className="auth-divider"><span>or</span></div>

              <form onSubmit={handleLoginSubmit} className="auth-form">
                {error && <div className="auth-error">{error}</div>}

                <div className="auth-field">
                  <label htmlFor="login-email">Email</label>
                  <input type="email" id="login-email" name="email" value={loginData.email} onChange={handleLoginChange} placeholder="you@example.com" required autoComplete="email" />
                </div>

                <div className="auth-field">
                  <label htmlFor="login-password">
                    Password
                    <button type="button" className="auth-forgot-link">Forgot password?</button>
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="Your password"
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" className="auth-show-pw" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading && <span className="auth-spinner" />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </>
          ) : (
            /* ════ SIGNUP MULTI-STEP ════ */
            <>
              <h1 className="auth-form-heading">Create account</h1>
              <p className="auth-form-subheading">
                {step === 1 && 'Start tracking your life decisions'}
                {step === 2 && 'Choose your username'}
                {step === 3 && 'Set your password'}
              </p>

              <StepDots step={step} />

              {/* Only show Google on step 1 */}
              {step === 1 && (
                <>
                  <button type="button" className="auth-google-btn" onClick={handleGoogleAuth}>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>
                  <div className="auth-divider"><span>or</span></div>
                </>
              )}

              {error && <div className="auth-error">{error}</div>}

              {/* Step 1: Email + Full Name */}
              {step === 1 && (
                <form onSubmit={handleStep1Next} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="signup-email">Email</label>
                    <input type="email" id="signup-email" name="email" value={signupData.email} onChange={handleSignupChange} placeholder="you@example.com" required autoComplete="email" />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="signup-fullName">Full Name</label>
                    <input type="text" id="signup-fullName" name="fullName" value={signupData.fullName} onChange={handleSignupChange} placeholder="Your full name" required autoComplete="name" />
                  </div>
                  <button type="submit" className="auth-submit">Next</button>
                </form>
              )}

              {/* Step 2: Username */}
              {step === 2 && (
                <form onSubmit={handleStep2Next} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="signup-username">Username</label>
                    <div className="auth-username-wrap">
                      <input
                        type="text"
                        id="signup-username"
                        name="username"
                        value={signupData.username}
                        onChange={handleSignupChange}
                        placeholder="e.g. john_doe"
                        required
                        minLength={3}
                        maxLength={30}
                        autoComplete="username"
                        autoFocus
                        className={usernameStatus === 'available' ? 'input-available' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'input-taken' : ''}
                      />
                      <span className="auth-username-status-icon"><UsernameStatusIcon /></span>
                    </div>
                    {usernameMsg && (
                      <span className={`auth-username-msg ${usernameStatus}`}>{usernameMsg}</span>
                    )}
                  </div>
                  <div className="auth-step-actions">
                    <button type="button" className="auth-back-btn" onClick={() => { setStep(1); setError(''); }}>Back</button>
                    <button type="submit" className="auth-submit auth-submit-flex" disabled={usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'}>Next</button>
                  </div>
                </form>
              )}

              {/* Step 3: Password */}
              {step === 3 && (
                <form onSubmit={handleStep3Submit} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="signup-password">Password</label>
                    <div className="auth-password-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="signup-password"
                        name="password"
                        value={signupData.password}
                        onChange={handleSignupChange}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button type="button" className="auth-show-pw" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label htmlFor="signup-confirmPassword">Confirm Password</label>
                    <input type="password" id="signup-confirmPassword" name="confirmPassword" value={signupData.confirmPassword} onChange={handleSignupChange} placeholder="Repeat your password" required minLength={6} autoComplete="new-password" />
                  </div>
                  <div className="auth-step-actions">
                    <button type="button" className="auth-back-btn" onClick={() => { setStep(2); setError(''); }}>Back</button>
                    <button type="submit" className="auth-submit auth-submit-flex" disabled={loading}>
                      {loading && <span className="auth-spinner" />}
                      {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <p className="auth-switch">
            {isLogin ? "New here?" : 'Have an account?'}
            <button onClick={toggleMode} className="auth-switch-btn">
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
