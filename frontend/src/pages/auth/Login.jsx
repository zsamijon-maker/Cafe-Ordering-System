import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(username, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/');
    } catch (err) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .brule-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0806;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          box-sizing: border-box;
        }

        .brule-card {
          display: flex;
          width: 100%;
          max-width: 820px;
          min-height: 560px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
        }

        /* ── Left Panel ── */
        .brule-left {
          flex: 1;
          background: #0f0c09;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px 36px;
          position: relative;
          border-right: 0.5px solid rgba(255,255,255,0.06);
          overflow: hidden;
        }

        .brule-glow-top {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(180,130,60,0.14) 0%, transparent 70%);
          top: -100px;
          left: -100px;
          pointer-events: none;
        }

        .brule-glow-bottom {
          position: absolute;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(180,130,60,0.08) 0%, transparent 70%);
          bottom: -80px;
          right: -60px;
          pointer-events: none;
        }

        .brule-brand {
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .brule-icon {
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brule-name {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: #e8c97a;
          letter-spacing: 0.02em;
          line-height: 1.1;
          margin: 0 0 6px;
        }

        .brule-subtitle {
          font-size: 10.5px;
          font-weight: 400;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(232,201,122,0.45);
          margin: 0;
        }

        .brule-divider {
          width: 40px;
          height: 1px;
          background: rgba(232,201,122,0.2);
          margin: 22px auto;
        }

        .brule-tagline {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 13.5px;
          color: rgba(255,255,255,0.28);
          line-height: 1.75;
          max-width: 190px;
          text-align: center;
        }

        .brule-art {
          margin-top: 36px;
          opacity: 0.16;
        }

        /* ── Right Panel ── */
        .brule-right {
          width: 360px;
          flex-shrink: 0;
          background: #13100d;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 52px 42px;
          box-sizing: border-box;
        }

        .brule-form-eyebrow {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #e8c97a;
          margin: 0 0 10px;
        }

        .brule-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 400;
          color: rgba(255,255,255,0.88);
          margin: 0 0 36px;
          line-height: 1.3;
        }

        .brule-form-title em {
          color: #e8c97a;
          font-style: italic;
        }

        .brule-field {
          margin-bottom: 20px;
        }

        .brule-label {
          display: block;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          margin-bottom: 8px;
        }

        .brule-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .brule-input-icon {
          position: absolute;
          left: 14px;
          color: rgba(232,201,122,0.35);
          font-size: 15px;
          pointer-events: none;
          z-index: 1;
          display: flex;
          align-items: center;
        }

        .brule-input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 13px 14px 13px 42px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.85);
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .brule-input:focus {
          border-color: rgba(232,201,122,0.45);
          background: rgba(232,201,122,0.04);
        }

        /* ULTIMATE AUTOFILL FIX FOR ANDROID/CHROME */
        .brule-input:-webkit-autofill,
        .brule-input:-webkit-autofill:focus,
        .brule-input:-webkit-autofill:hover,
        .brule-input:-webkit-autofill:active {
          color-scheme: dark !important;
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #13100d inset !important;
          box-shadow: 0 0 0px 1000px #13100d inset !important;
          background-color: #13100d !important;
          transition: background-color 5000s ease-in-out 0s !important;
          border-radius: 10px !important;
        }

        .brule-input::placeholder {
          color: rgba(255,255,255,0.16);
        }

        .brule-btn {
          width: 100%;
          margin-top: 10px;
          padding: 14px 24px;
          background: #e8c97a;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0f0c09;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.1s, opacity 0.2s;
          -webkit-appearance: none;
          appearance: none;
        }

        .brule-btn:hover:not(:disabled) {
          background: #f0d88e;
        }

        .brule-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .brule-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .brule-btn-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
          animation: bruleShimmer 2.6s infinite;
          pointer-events: none;
        }

        @keyframes bruleShimmer {
          0%   { left: -100%; }
          50%  { left: 140%; }
          100% { left: 140%; }
        }

        .brule-footer {
          margin-top: 26px;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          text-align: center;
          line-height: 1.6;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .brule-card  { flex-direction: column; min-height: auto; border-radius: 20px; box-sizing: border-box; }
          .brule-left  { padding: 32px 20px; border-right: none; border-bottom: 0.5px solid rgba(255,255,255,0.06); box-sizing: border-box; }
          .brule-right { width: 100%; padding: 32px 20px; box-sizing: border-box; }
          .brule-input { padding: 14px 14px 14px 42px; font-size: 16px; border-radius: 10px !important; }
          .brule-btn { padding: 16px 24px; font-size: 14px; border-radius: 10px !important; }
        }
      `}</style>

      <div className="brule-root">
        <div className="brule-card">

          {/* ── Left Brand Panel ── */}
          <div className="brule-left">
            <div className="brule-glow-top" />
            <div className="brule-glow-bottom" />
            <div className="brule-brand">

              {/* Coffee cup icon */}
              <div className="brule-icon">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="28" cy="28" r="27" stroke="#e8c97a" strokeWidth="0.7" strokeOpacity="0.35" />
                  <circle cx="28" cy="28" r="20" stroke="#e8c97a" strokeWidth="0.5" strokeOpacity="0.18" />
                  <ellipse cx="28" cy="28" rx="11" ry="15" stroke="#e8c97a" strokeWidth="1.3" strokeOpacity="0.82" />
                  <path d="M28 13 Q21 20 21 28 Q21 36 28 43" stroke="#e8c97a" strokeWidth="1.1" strokeOpacity="0.55" fill="none" />
                  <circle cx="28" cy="28" r="2.8" fill="#e8c97a" fillOpacity="0.45" />
                </svg>
              </div>

              <h1 className="brule-name">Brûlé</h1>
              <p className="brule-subtitle">Café Management</p>
              <div className="brule-divider" />
              <p className="brule-tagline">
                Where every order is an art — and every shift runs smooth.
              </p>

              {/* Decorative cup art */}
              <div className="brule-art">
                <svg width="150" height="86" viewBox="0 0 150 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="75" cy="62" rx="50" ry="9" stroke="#e8c97a" strokeWidth="0.8" />
                  <path d="M33 62 L25 28 L125 28 L117 62" stroke="#e8c97a" strokeWidth="0.8" />
                  <rect x="25" y="23" width="100" height="8" rx="4" stroke="#e8c97a" strokeWidth="0.8" />
                  <path d="M58 23 Q62 9 75 7 Q88 9 92 23" stroke="#e8c97a" strokeWidth="0.8" fill="none" />
                  <path d="M63 23 Q66 15 75 13 Q84 15 87 23" stroke="#e8c97a" strokeWidth="0.5" fill="none" opacity="0.5" />
                  <path d="M61 11 Q59 5 61 1" stroke="#e8c97a" strokeWidth="0.6" opacity="0.45" />
                  <path d="M75 9 Q73 3 75 0" stroke="#e8c97a" strokeWidth="0.6" opacity="0.45" />
                  <path d="M89 11 Q91 5 89 1" stroke="#e8c97a" strokeWidth="0.6" opacity="0.45" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Right Form Panel ── */}
          <div className="brule-right">
            <p className="brule-form-eyebrow">Staff Portal</p>
            <h2 className="brule-form-title">
              Sign in to your<br /><em>workspace</em>
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="brule-field">
                <label className="brule-label" htmlFor="brule-username">Username</label>
                <div className="brule-input-wrap">
                  <span className="brule-input-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="brule-username"
                    className="brule-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="jireh"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="brule-field">
                <label className="brule-label" htmlFor="brule-password">Password</label>
                <div className="brule-input-wrap">
                  <span className="brule-input-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="brule-password"
                    className="brule-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button className="brule-btn" type="submit" disabled={loading}>
                <span className="brule-btn-shimmer" />
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </span>
              </button>
            </form>

            <p className="brule-footer">
              Brûlé Café Management System &copy; {new Date().getFullYear()}
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;