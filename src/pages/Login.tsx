import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ChefHat, Loader2, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { currentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  if (currentUser) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');

        .login-page {
          height: 100vh;
          display: flex;
          font-family: 'Inter', system-ui, sans-serif;
          background: #0a0a0a;
          overflow: hidden;
        }

        /* ─── LEFT PANEL ─── */
        .login-image-panel {
          position: relative;
          flex: 1.1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
        }

        .login-image-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg,
            rgba(10,10,10,0.1) 0%,
            rgba(10,10,10,0.0) 30%,
            rgba(10,10,10,0.0) 45%,
            rgba(10,10,10,0.5) 70%,
            rgba(10,10,10,0.92) 100%
          );
          z-index: 2;
        }

        .login-image-panel img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: 1;
          animation: loginImageZoom 25s ease-in-out infinite alternate;
        }

        @keyframes loginImageZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }

        .login-image-overlay {
          position: relative;
          z-index: 3;
          padding: 2rem 2.5rem;
          animation: loginSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .login-image-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 100px;
          padding: 0.35rem 1rem;
          font-size: 0.72rem;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.04em;
          margin-bottom: 0.75rem;
        }

        .login-image-badge .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
          animation: loginPulse 2s ease-in-out infinite;
        }

        @keyframes loginPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        .login-image-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: white;
          line-height: 1.15;
          margin-bottom: 0.5rem;
        }

        .login-image-title span {
          color: hsl(32, 95%, 55%);
        }

        .login-image-subtitle {
          font-size: 0.88rem;
          color: rgba(255,255,255,0.55);
          line-height: 1.5;
          max-width: 400px;
          font-weight: 300;
        }

        .login-stats-row {
          display: flex;
          gap: 2rem;
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .login-stat-value {
          font-size: 1.15rem;
          font-weight: 700;
          color: white;
        }

        .login-stat-label {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.4);
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 0.15rem;
        }

        /* ─── RIGHT PANEL ─── */
        .login-form-panel {
          flex: 0.9;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 1.5rem 2.5rem;
          background: #fafaf9;
          position: relative;
          overflow: hidden;
        }

        .login-form-panel::before {
          content: '';
          position: absolute;
          top: -150px;
          right: -150px;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: radial-gradient(circle, hsla(32, 95%, 55%, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-form-container {
          width: 100%;
          max-width: 380px;
          position: relative;
          z-index: 2;
          animation: loginFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }

        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes loginSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-logo-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .login-logo-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, hsl(32, 95%, 44%) 0%, hsl(25, 90%, 48%) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px hsla(32, 95%, 44%, 0.3);
        }

        .login-logo-text h1 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin: 0;
        }

        .login-logo-text p {
          font-size: 0.7rem;
          color: #999;
          font-weight: 400;
          margin: 0;
        }

        .login-form-heading {
          margin-bottom: 1.25rem;
        }

        .login-form-heading h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.04em;
          margin: 0 0 0.3rem 0;
        }

        .login-form-heading p {
          font-size: 0.85rem;
          color: #888;
          font-weight: 400;
          margin: 0;
        }

        .login-field-group {
          margin-bottom: 0.875rem;
        }

        .login-field-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: #444;
          margin-bottom: 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .login-field-label svg {
          width: 13px;
          height: 13px;
          color: #999;
        }

        .login-input-wrapper {
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-input-wrapper.focused {
          transform: translateY(-1px);
        }

        .login-input-wrapper input {
          width: 100%;
          height: 46px;
          padding: 0 1rem;
          font-size: 0.9rem;
          font-family: 'Inter', system-ui, sans-serif;
          color: #1a1a1a;
          background: white;
          border: 1.5px solid #e5e5e5;
          border-radius: 10px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          box-sizing: border-box;
        }

        .login-input-wrapper input::placeholder {
          color: #c5c5c5;
          font-weight: 400;
        }

        .login-input-wrapper input:focus {
          border-color: hsl(32, 95%, 44%);
          box-shadow: 0 0 0 3px hsla(32, 95%, 44%, 0.1), 0 2px 8px rgba(0,0,0,0.06);
        }

        .login-input-wrapper.has-right-icon input {
          padding-right: 2.75rem;
        }

        .login-input-toggle {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #bbb;
          border-radius: 6px;
          transition: all 0.2s ease;
          border: none;
          background: none;
        }

        .login-input-toggle:hover {
          color: #666;
          background: rgba(0,0,0,0.04);
        }

        .login-submit-btn {
          width: 100%;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'Inter', system-ui, sans-serif;
          color: white;
          background: linear-gradient(135deg, hsl(32, 95%, 44%) 0%, hsl(25, 85%, 42%) 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px hsla(32, 95%, 44%, 0.35);
          letter-spacing: 0.01em;
          position: relative;
          overflow: hidden;
        }

        .login-submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, hsla(0,0%,100%,0.15) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px hsla(32, 95%, 44%, 0.4);
        }

        .login-submit-btn:hover:not(:disabled)::before {
          opacity: 1;
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-submit-btn .btn-arrow {
          transition: transform 0.3s ease;
        }

        .login-submit-btn:hover:not(:disabled) .btn-arrow {
          transform: translateX(3px);
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.125rem 0;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e8e8e8;
        }

        .login-divider span {
          font-size: 0.68rem;
          color: #bbb;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .login-role-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }

        .login-role-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          padding: 0.65rem 0.5rem;
          background: white;
          border: 1.5px solid #f0f0f0;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .login-role-card:hover {
          border-color: hsla(32, 95%, 44%, 0.3);
          background: hsla(32, 95%, 44%, 0.02);
        }

        .login-role-icon {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .login-role-icon.admin {
          background: hsla(32, 95%, 44%, 0.1);
        }

        .login-role-icon.staff {
          background: hsla(210, 100%, 52%, 0.1);
        }

        .login-role-title {
          font-size: 0.76rem;
          font-weight: 600;
          color: #333;
        }

        .login-role-desc {
          font-size: 0.65rem;
          color: #999;
          text-align: center;
          line-height: 1.3;
        }

        .login-footer {
          margin-top: 1.25rem;
          text-align: center;
        }

        .login-footer p {
          font-size: 0.68rem;
          color: #c0c0c0;
          margin: 0;
          line-height: 1.6;
        }

        .login-footer .powered-by {
          font-size: 0.65rem;
          color: #b0b0b0;
          margin-top: 0.15rem;
        }

        .login-footer .powered-by a {
          color: hsl(32, 95%, 44%);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .login-footer .powered-by a:hover {
          color: hsl(32, 95%, 38%);
          text-decoration: underline;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1024px) {
          .login-image-panel { display: none; }
          .login-form-panel { flex: 1; }
        }

        @media (max-height: 700px) {
          .login-form-heading { margin-bottom: 1rem; }
          .login-form-heading h2 { font-size: 1.3rem; }
          .login-logo-wrapper { margin-bottom: 1rem; }
          .login-field-group { margin-bottom: 0.7rem; }
          .login-input-wrapper input { height: 42px; }
          .login-submit-btn { height: 42px; }
          .login-divider { margin: 0.75rem 0; }
          .login-role-card { padding: 0.5rem; }
          .login-footer { margin-top: 0.75rem; }
          .login-image-overlay { padding: 1.5rem 2rem; }
          .login-image-title { font-size: 1.75rem; }
          .login-stats-row { margin-top: 0.75rem; padding-top: 0.75rem; }
        }
      `}</style>

      {/* ─── LEFT: BAKERY IMAGE PANEL ─── */}
      <div className="login-image-panel">
        <img
          src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80"
          alt="Artisan bakery with freshly baked breads"
          loading="eager"
        />
        <div className="login-image-overlay">
          <div className="login-image-badge">
            <span className="badge-dot" />
            Enterprise Resource Planning
          </div>
          <h2 className="login-image-title">
            Crafting <span>Excellence</span>,<br />
            One Batch at a Time
          </h2>
          <p className="login-image-subtitle">
            Streamline your bakery operations with intelligent production management, real-time inventory tracking, and seamless POS integration.
          </p>
          <div className="login-stats-row">
            <div className="login-stat">
              <span className="login-stat-value">99.9%</span>
              <span className="login-stat-label">Uptime</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-value">Real-time</span>
              <span className="login-stat-label">Sync</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-value">Multi-Branch</span>
              <span className="login-stat-label">Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: LOGIN FORM PANEL ─── */}
      <div className="login-form-panel">
        <div className="login-form-container">
          {/* Logo */}
          <div className="login-logo-wrapper">
            <div className="login-logo-icon">
              <ChefHat style={{ width: 24, height: 24, color: 'white' }} />
            </div>
            <div className="login-logo-text">
              <h1>Bakewise</h1>
              <p>Enterprise Platform</p>
            </div>
          </div>

          {/* Heading */}
          <div className="login-form-heading">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="login-field-group">
              <label className="login-field-label">
                <Mail /> Email address
              </label>
              <div className={`login-input-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@bakery.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            <div className="login-field-group">
              <label className="login-field-label">
                <Lock /> Password
              </label>
              <div className={`login-input-wrapper has-right-icon ${focusedField === 'password' ? 'focused' : ''}`}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  className="login-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="btn-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>Access Roles</span>
          </div>

          {/* Role Cards */}
          <div className="login-role-cards">
            <div className="login-role-card">
              <div className="login-role-icon admin">🔑</div>
              <span className="login-role-title">Admin</span>
              <span className="login-role-desc">Full control & settings</span>
            </div>
            <div className="login-role-card">
              <div className="login-role-icon staff">👤</div>
              <span className="login-role-title">Staff</span>
              <span className="login-role-desc">Assigned tasks only</span>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>© 2026 Bakewise ERP · All rights reserved</p>
            <p className="powered-by">
              Powered by <a href="tel:+923342826675">GenX Systems</a> · +92 334 2826675
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
