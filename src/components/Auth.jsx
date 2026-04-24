import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GitBranch, GitCommitHorizontal, GitFork, Eye, EyeOff, ChartLine } from 'lucide-react';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match'); setLoading(false); return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters'); setLoading(false); return;
        }
        await register(formData.email, formData.username, formData.password);
      }
    } catch (err) {
      setError(err.message || `${isLogin ? 'Login' : 'Registration'} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(p => !p);
    setError('');
    setFormData({ email: '', username: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-brand-logo">
            <GitBranch size={32} />
            <span>GitLife</span>
          </div>
          <h2 className="auth-brand-tagline">Track your life's story,<br />one commit at a time.</h2>
          <ul className="auth-features">
            <li><GitCommitHorizontal size={18} /><span>Log decisions like git commits</span></li>
            <li><GitFork size={18} /><span>Explore "what if" branches</span></li>
            <li><ChartLine size={18} /><span>Track your impact over time</span></li>
          </ul>
        </div>
        <div className="auth-brand-pattern" aria-hidden="true" />
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-mobile-logo">
            <GitBranch size={24} />
            <span>GitLife</span>
          </div>

          <div className="auth-pill-switcher">
            <button className={`auth-pill ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>Sign In</button>
            <button className={`auth-pill ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>Register</button>
          </div>

          <h1 className="auth-form-heading">{isLogin ? 'Welcome back' : 'Create account'}</h1>
          <p className="auth-form-subheading">{isLogin ? 'Sign in to continue your journey' : 'Start tracking your life decisions'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required autoComplete="email" />
            </div>

            {!isLogin && (
              <div className="auth-field">
                <label htmlFor="username">Username</label>
                <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" required minLength={3} maxLength={30} autoComplete="username" />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button type="button" className="auth-show-pw" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password" required minLength={6} autoComplete="new-password" />
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

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
