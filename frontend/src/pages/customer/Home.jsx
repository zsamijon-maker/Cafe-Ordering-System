import React from 'react';
import { Link } from 'react-router-dom';
import { FaCoffee, FaShoppingBag, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

// Replace with /images/cafe-hero.jpg when you add your own photo to frontend/public/images/
const CAFE_HERO_IMAGE =
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1400&q=80';
const CAFE_SECONDARY_IMAGE =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80';

const Home = () => {
  return (
    <>
      <style>{`
        @keyframes homeFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes homeFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes homeKenBurns {
          0% { transform: scale(1.08) translate(0, 0); }
          100% { transform: scale(1.18) translate(-2%, -1%); }
        }

        @keyframes homeFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(0.6deg); }
        }

        @keyframes homeGlowPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(232,201,122,0.15), 0 24px 60px rgba(0,0,0,0.55); }
          50% { box-shadow: 0 0 56px rgba(232,201,122,0.28), 0 28px 70px rgba(0,0,0,0.6); }
        }

        @keyframes homeShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes homeSteam {
          0% { opacity: 0; transform: translateY(0) scale(0.6); }
          40% { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
        }

        @keyframes homeOrbDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }

        @keyframes homeSlideReveal {
          from { clip-path: inset(0 100% 0 0 round 20px); }
          to { clip-path: inset(0 0 0 0 round 20px); }
        }

        @keyframes homeBannerPan {
          0% { transform: scale(1.05); }
          100% { transform: scale(1.12); }
        }

        .home-page {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(180deg, #0a0806 0%, #0f0c09 100%);
          min-height: calc(100vh - 72px);
          margin: -24px -20px 0;
          padding: 0;
          color: rgba(255,255,255,0.9);
          overflow-x: hidden;
        }

        .home-hero {
          position: relative;
          padding: 48px 36px 64px;
          overflow: hidden;
          border-bottom: 0.5px solid rgba(232,201,122,0.12);
          min-height: 520px;
        }

        .home-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .home-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: homeKenBurns 18s ease-in-out infinite alternate;
          filter: brightness(0.35) saturate(0.9);
        }

        .home-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(105deg, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.75) 42%, rgba(10,8,6,0.45) 70%, rgba(10,8,6,0.55) 100%),
            radial-gradient(ellipse 70% 80% at 75% 50%, rgba(232,201,122,0.06), transparent 60%);
          z-index: 1;
        }

        .home-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 1;
          animation: homeOrbDrift 12s ease-in-out infinite;
        }

        .home-orb-1 {
          width: 280px;
          height: 280px;
          background: rgba(232,201,122,0.12);
          top: 10%;
          right: 15%;
          animation-delay: 0s;
        }

        .home-orb-2 {
          width: 200px;
          height: 200px;
          background: rgba(180,120,60,0.1);
          bottom: 20%;
          left: 5%;
          animation-delay: -4s;
        }

        .home-steam {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.25);
          border-radius: 50%;
          filter: blur(4px);
          z-index: 2;
          animation: homeSteam 4s ease-in infinite;
          pointer-events: none;
        }

        .home-steam-1 { left: 68%; top: 55%; animation-delay: 0s; }
        .home-steam-2 { left: 72%; top: 52%; animation-delay: 1.2s; width: 6px; height: 6px; }
        .home-steam-3 { left: 75%; top: 58%; animation-delay: 2.4s; }
        .home-steam-4 { left: 70%; top: 48%; animation-delay: 3.1s; width: 5px; height: 5px; }

        .home-hero-inner {
          position: relative;
          z-index: 3;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .home-hero-copy {
          animation: homeFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .home-eyebrow {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(232,201,122,0.75);
          margin-bottom: 14px;
          animation: homeFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }

        .home-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 5vw, 54px);
          line-height: 1.08;
          margin: 0 0 16px;
          animation: homeFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }

        .home-title-gold {
          background: linear-gradient(120deg, #e8c97a 0%, #f5e6b8 40%, #e8c97a 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: homeShimmer 6s linear infinite;
        }

        .home-title em {
          font-style: italic;
          color: rgba(255,255,255,0.95);
          -webkit-text-fill-color: rgba(255,255,255,0.95);
        }

        .home-lead {
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255,255,255,0.78);
          max-width: 480px;
          margin: 0 0 28px;
          animation: homeFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both;
        }

        .home-cta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          animation: homeFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
        }

        .home-btn-primary {
          padding: 13px 24px;
          background: linear-gradient(135deg, #e8c97a, #f0d88e);
          border: none;
          border-radius: 8px;
          color: #0f0c09;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .home-btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 14px 32px rgba(232,201,122,0.25);
        }

        .home-btn-secondary {
          padding: 13px 24px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(8px);
          border: 0.5px solid rgba(232,201,122,0.35);
          border-radius: 8px;
          color: #e8c97a;
          font-weight: 500;
          font-size: 14px;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }

        .home-btn-secondary:hover {
          background: rgba(232,201,122,0.12);
          border-color: rgba(232,201,122,0.6);
          transform: translateY(-2px);
        }

        .home-visual-wrap {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: homeFadeIn 1.2s ease 0.4s both;
        }

        .home-image-frame {
          position: relative;
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          padding: 6px;
          background: linear-gradient(135deg, rgba(232,201,122,0.5), rgba(232,201,122,0.08), rgba(232,201,122,0.35));
          animation: homeFloat 6s ease-in-out infinite, homeGlowPulse 4s ease-in-out infinite, homeSlideReveal 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both;
        }

        .home-image-inner {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 4 / 5;
        }

        .home-image-inner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          animation: homeKenBurns 14s ease-in-out infinite alternate;
        }

        .home-image-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            125deg,
            transparent 40%,
            rgba(255,255,255,0.08) 50%,
            transparent 60%
          );
          background-size: 200% 200%;
          animation: homeShimmer 5s ease-in-out infinite;
          pointer-events: none;
        }

        .home-image-badge {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(10,8,6,0.75);
          backdrop-filter: blur(12px);
          border: 0.5px solid rgba(232,201,122,0.2);
          display: flex;
          align-items: center;
          gap: 12px;
          animation: homeFadeUp 0.8s ease 1s both;
        }

        .home-image-badge svg {
          font-size: 28px;
          color: #e8c97a;
          flex-shrink: 0;
        }

        .home-image-badge strong {
          display: block;
          font-family: 'Playfair Display', serif;
          color: #fff;
          font-size: 15px;
        }

        .home-image-badge span {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
        }

        .home-mini-card {
          position: absolute;
          top: -12px;
          right: -16px;
          width: 110px;
          height: 110px;
          border-radius: 14px;
          overflow: hidden;
          border: 2px solid rgba(232,201,122,0.35);
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          animation: homeFloat 5s ease-in-out infinite reverse;
          animation-delay: -1.5s;
        }

        .home-mini-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .home-banner {
          position: relative;
          height: 220px;
          overflow: hidden;
          margin: 0;
        }

        .home-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: homeBannerPan 20s ease-in-out infinite alternate;
          filter: brightness(0.5);
        }

        .home-banner-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10,8,6,0.35);
        }

        .home-banner-text {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 3vw, 32px);
          color: #e8c97a;
          letter-spacing: 0.04em;
          text-align: center;
          padding: 0 24px;
          animation: homeFadeUp 1s ease both;
          text-shadow: 0 4px 24px rgba(0,0,0,0.6);
        }

        .home-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 36px 56px;
        }

        .home-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: #e8c97a;
          margin: 0 0 8px;
          text-align: center;
        }

        .home-section-sub {
          text-align: center;
          color: rgba(255,255,255,0.55);
          font-size: 14px;
          margin: 0 0 32px;
        }

        .home-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .home-feature {
          padding: 28px 22px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          border: 0.5px solid rgba(232,201,122,0.1);
          text-align: center;
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
          animation: homeFadeUp 0.7s ease both;
        }

        .home-feature:nth-child(1) { animation-delay: 0.1s; }
        .home-feature:nth-child(2) { animation-delay: 0.25s; }
        .home-feature:nth-child(3) { animation-delay: 0.4s; }

        .home-feature:hover {
          border-color: rgba(232,201,122,0.3);
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.35);
        }

        .home-feature-icon {
          font-size: 30px;
          color: #e8c97a;
          margin-bottom: 14px;
          transition: transform 0.3s;
        }

        .home-feature:hover .home-feature-icon {
          transform: scale(1.15) rotate(-8deg);
        }

        .home-feature h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: rgba(255,255,255,0.95);
          margin: 0 0 8px;
        }

        .home-feature p {
          margin: 0;
          font-size: 13px;
          line-height: 1.55;
          color: rgba(255,255,255,0.58);
        }

        .home-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 36px;
        }

        .home-info-card {
          padding: 22px 24px;
          border-radius: 12px;
          background: rgba(232,201,122,0.04);
          border: 0.5px solid rgba(232,201,122,0.1);
          display: flex;
          gap: 14px;
          align-items: flex-start;
          transition: transform 0.25s, border-color 0.25s;
        }

        .home-info-card:hover {
          transform: translateX(4px);
          border-color: rgba(232,201,122,0.25);
        }

        .home-info-card svg {
          color: #e8c97a;
          font-size: 22px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .home-info-card strong {
          display: block;
          color: #e8c97a;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .home-info-card span {
          font-size: 14px;
          color: rgba(255,255,255,0.72);
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .home-hero { min-height: auto; padding: 40px 24px 48px; }
          .home-hero-inner {
            grid-template-columns: 1fr;
            gap: 36px;
            text-align: center;
          }
          .home-lead { margin-left: auto; margin-right: auto; }
          .home-cta { justify-content: center; }
          .home-hero-bg img { filter: brightness(0.28); }
          .home-hero-overlay {
            background: linear-gradient(180deg, rgba(10,8,6,0.88) 0%, rgba(10,8,6,0.82) 55%, rgba(10,8,6,0.7) 100%);
          }
          .home-mini-card { right: 8px; top: -8px; width: 90px; height: 90px; }
          .home-features { grid-template-columns: 1fr; }
          .home-info { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .home-hero { padding: 32px 16px 40px; }
          .home-section { padding: 36px 16px 48px; }
          .home-banner { height: 160px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-hero-bg img,
          .home-image-inner img,
          .home-banner img,
          .home-image-frame,
          .home-mini-card,
          .home-orb,
          .home-steam,
          .home-title-gold {
            animation: none !important;
          }
          .home-hero-copy,
          .home-eyebrow,
          .home-title,
          .home-lead,
          .home-cta,
          .home-visual-wrap,
          .home-image-badge,
          .home-feature,
          .home-banner-text {
            animation: homeFadeIn 0.5s ease both !important;
          }
        }
      `}</style>

      <div className="home-page">
        <section className="home-hero" aria-label="Welcome to BrewPoint">
          <div className="home-hero-bg" aria-hidden="true">
            <img src={CAFE_HERO_IMAGE} alt="" />
          </div>
          <div className="home-hero-overlay" aria-hidden="true" />
          <div className="home-orb home-orb-1" aria-hidden="true" />
          <div className="home-orb home-orb-2" aria-hidden="true" />
          <span className="home-steam home-steam-1" aria-hidden="true" />
          <span className="home-steam home-steam-2" aria-hidden="true" />
          <span className="home-steam home-steam-3" aria-hidden="true" />
          <span className="home-steam home-steam-4" aria-hidden="true" />

          <div className="home-hero-inner">
            <div className="home-hero-copy">
              <p className="home-eyebrow">BrewPoint Café</p>
              <h1 className="home-title">
                <span className="home-title-gold">Your perfect cup,</span>
                <br />
                <em>one order away</em>
              </h1>
              <p className="home-lead">
                Step into warmth and aroma. Order fresh coffee, tea, and pastries online — pickup, dine-in, or delivery.
              </p>
              <div className="home-cta">
                <Link to="/menu" className="home-btn-primary">Order Now</Link>
                <Link to="/about" className="home-btn-secondary">About Us</Link>
                <Link to="/track" className="home-btn-secondary">Track Order</Link>
              </div>
            </div>

            <div className="home-visual-wrap">
              <div className="home-image-frame">
                <div className="home-image-inner">
                  <img
                    src={CAFE_HERO_IMAGE}
                    alt="Cozy café interior with warm lighting"
                    loading="eager"
                  />
                  <div className="home-image-shine" aria-hidden="true" />
                  <div className="home-image-badge">
                    <FaCoffee />
                    <div>
                      <strong>Crafted with care</strong>
                      <span>Espresso · Pastries · Good vibes</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="home-mini-card" aria-hidden="true">
                <img src={CAFE_SECONDARY_IMAGE} alt="" />
              </div>
            </div>
          </div>
        </section>

        <div className="home-banner" aria-hidden="true">
          <img src={CAFE_SECONDARY_IMAGE} alt="" />
          <div className="home-banner-overlay">
            <p className="home-banner-text">Where every sip tells a story</p>
          </div>
        </div>

        <section className="home-section">
          <h2 className="home-section-title">Why BrewPoint?</h2>
          <p className="home-section-sub">Everything you need for a smooth café experience</p>
          <div className="home-features">
            <div className="home-feature">
              <FaCoffee className="home-feature-icon" />
              <h3>Fresh Menu</h3>
              <p>Explore our full selection of drinks and bites, updated with live stock so you always know what&apos;s available.</p>
            </div>
            <div className="home-feature">
              <FaShoppingBag className="home-feature-icon" />
              <h3>Easy Ordering</h3>
              <p>Add items to your cart, choose pickup, dine-in, or delivery, and checkout with your preferred payment method.</p>
            </div>
            <div className="home-feature">
              <FaMapMarkerAlt className="home-feature-icon" />
              <h3>Track Anytime</h3>
              <p>Follow your order from kitchen to counter or doorstep with real-time status updates.</p>
            </div>
          </div>

          <div className="home-info">
            <div className="home-info-card">
              <FaClock />
              <div>
                <strong>Hours</strong>
                <span>Mon – Sun · 8:00 AM – 9:00 PM</span>
              </div>
            </div>
            <div className="home-info-card">
              <FaMapMarkerAlt />
              <div>
                <strong>Visit us</strong>
                <span>Campus café — order online and skip the line at pickup.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
