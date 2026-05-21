import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <>
      <style>{`
        .about-page {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(180deg, #0a0806 0%, #0f0c09 100%);
          min-height: calc(100vh - 72px);
          margin: -24px -20px 0;
          padding: 28px 36px 48px;
          color: rgba(255,255,255,0.9);
        }

        .about-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .about-hero {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:24px;
          margin: 0 0 20px;
        }

        .about-title {
          font-family: 'Playfair Display', serif;
          color: #e8c97a;
          font-size: 36px;
          margin: 0;
        }

        .about-sub {
          color: rgba(255,255,255,0.75);
          margin-top: 8px;
          max-width: 720px;
          line-height: 1.6;
        }

        .profiles {
          display:grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 20px;
        }

        .card {
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          border: 1px solid rgba(232,201,122,0.06);
          padding: 20px;
          border-radius: 14px;
          display:flex;
          gap:16px;
          align-items:center;
          box-shadow: 0 8px 30px rgba(0,0,0,0.45);
        }

        .avatar {
          width:120px;
          height:120px;
          border-radius: 12px;
          object-fit:cover;
          border: 3px solid rgba(232,201,122,0.12);
          box-shadow: 0 6px 18px rgba(0,0,0,0.5);
          flex-shrink:0;
        }

        .meta h3 { margin:0; color:#fff; font-family: 'Playfair Display', serif }
        .meta p { margin:6px 0 0; color: rgba(255,255,255,0.8); font-size:14px }

        @media (max-width:800px) {
          .about-hero { flex-direction:column; align-items:flex-start }
          .profiles { grid-template-columns: 1fr }
        }

        @media (max-width: 640px) {
          .about-page { padding: 20px 16px 40px; }
        }
      `}</style>

      <div className="about-page">
        <div className="about-inner">
        <div className="about-hero">
          <div>
            <h1 className="about-title">About Us</h1>
            <p className="about-sub">BrewPoint is crafted by students who love coffee and clean experiences. We focus on a minimal, elegant ordering flow and excellent service.</p>
          </div>
          <div style={{display:'flex', gap:12}}>
            <Link to="/menu" className="btn-primary">Browse Menu</Link>
          </div>
        </div>

        <div className="profiles">
          <div className="card">
            <img src="/images/kenneth.jpg" alt="Zar Kenneth C. Samijon" className="avatar" />
            <div className="meta">
              <h3>Zar Kenneth C. Samijon</h3>
              <p>3rd Year Computer Science Student. Passionate about web apps, UX, and building delightful ordering experiences for customers.</p>
            </div>
          </div>

          <div className="card">
            <img src="/images/jennifer.jpg" alt="Jennifer Halawig" className="avatar" />
            <div className="meta">
              <h3>Jennifer Halawig</h3>
              <p>3rd Year Computer Science Student. Focused on front-end design, accessibility, and creating consistent, polished interfaces.</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default About;
