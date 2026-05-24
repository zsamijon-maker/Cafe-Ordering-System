import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { FaShoppingCart, FaUser, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkClass = (path) => {
    const isActive = path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);
    return isActive ? 'nav-link active' : 'nav-link';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <style>{`
        .navbar {
          background: linear-gradient(135deg, #0f0c09 0%, #13100d 100%);
          border-bottom: 0.5px solid rgba(232,201,122,0.15);
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'DM Sans', sans-serif;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }

        .nav-brand a {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: #e8c97a;
          text-decoration: none;
          letter-spacing: 0.02em;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-brand a:hover {
          color: #f0d88e;
          transform: scale(1.05);
        }

        .nav-links {
          display: flex;
          gap: 28px;
          align-items: center;
        }

        /* Override global index.css .navbar a { color: white } */
        .navbar .nav-links .nav-link {
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(232,201,122,0.7);
          text-decoration: none;
          transition: color 0.2s, transform 0.2s;
          position: relative;
          padding: 8px 0;
          margin: 0;
          line-height: 1.2;
          white-space: nowrap;
        }

        .navbar .nav-links .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #e8c97a;
          transition: width 0.2s;
        }

        .navbar .nav-links .nav-link:hover,
        .navbar .nav-links .nav-link.active {
          color: #e8c97a;
        }

        .navbar .nav-links .nav-link:hover::after,
        .navbar .nav-links .nav-link.active::after {
          width: 100%;
        }

        .navbar .nav-links .nav-link.cart-link {
          padding: 8px 10px;
          text-transform: none;
          letter-spacing: 0;
        }

        .navbar .nav-links .nav-link.cart-link::after {
          display: none;
        }

        .cart-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(232,201,122,0.12);
        }

        .cart-link svg {
          width: 18px;
          height: 18px;
          color: inherit;
        }

        .cart-link:hover {
          background: rgba(232,201,122,0.06);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.35);
        }

        .cart-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #e8c97a;
          color: #0f0c09;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          border: 2px solid rgba(15,12,9,0.95);
          box-shadow: 0 2px 6px rgba(0,0,0,0.45);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(232,201,122,0.7);
          padding: 8px 16px;
          border-left: 0.5px solid rgba(232,201,122,0.15);
        }

        .logout-btn {
          background: rgba(232,201,122,0.15);
          border: 0.5px solid rgba(232,201,122,0.3);
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e8c97a;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .logout-btn:hover {
          background: rgba(232,201,122,0.25);
          border-color: rgba(232,201,122,0.5);
          color: #f0d88e;
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 12px 16px;
            gap: 16px;
          }

          .nav-brand a {
            font-size: 20px;
          }

          .nav-links {
            gap: 16px;
            flex-wrap: wrap;
          }

          .navbar .nav-links .nav-link {
            font-size: 11px;
          }

          .user-info {
            font-size: 11px;
            padding: 6px 12px;
          }
        }

        @media (max-width: 480px) {
          .navbar {
            padding: 10px 12px;
            flex-direction: column;
            gap: 12px;
          }

          .nav-links {
            width: 100%;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .navbar .nav-links .nav-link {
            font-size: 10px;
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">☕ BrewPoint</Link>
        </div>
        <div className="nav-links">
          {/* Show Menu/Cart only to customers (unauthenticated users or users without admin/staff roles) */}
          {(!user || (user && !['admin', 'staff'].includes(user.role))) && (
            <>
              <Link to="/" className={navLinkClass('/')}>Home</Link>
              <Link to="/menu" className={navLinkClass('/menu')}>Menu</Link>
              <Link to="/about" className={navLinkClass('/about')}>About Us</Link>
              <Link to="/cart" className={`${navLinkClass('/cart')} cart-link`}>
                <FaShoppingCart />
                {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
              </Link>
              <Link to="/track" className={navLinkClass('/track')}>Track Order</Link>
            </>
          )}
          
          {user ? (
            <>
              {user.role === 'admin' && <Link to="/admin" className={navLinkClass('/admin')}>Admin</Link>}
              {user.role === 'staff' && <Link to="/staff" className={navLinkClass('/staff')}>Staff</Link>}
              <span className="user-info"><FaUser /> {user.name}</span>
              <button onClick={handleLogout} className="logout-btn"><FaSignOutAlt /></button>
            </>
          ) : (
            <Link to="/login" className={navLinkClass('/login')}>Login</Link>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
