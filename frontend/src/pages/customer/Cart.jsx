import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { FaTrash } from 'react-icons/fa';
import formatCurrencyPHP from '../../utils/currency';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalAmount } = useContext(CartContext);

  if (cart.length === 0) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

          .empty-cart {
            min-height: calc(100vh - 72px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: linear-gradient(180deg, #0a0806 0%, #0f0c09 100%);
            color: rgba(255,255,255,0.9);
            padding: 28px;
            font-family: 'DM Sans', sans-serif;
          }

          .empty-cart h2 { color: #e8c97a; font-family: 'Playfair Display', serif; }

          .btn-primary {
            padding: 10px 16px;
            background: linear-gradient(135deg,#e8c97a,#f0d88e);
            color: #0f0c09;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          }
        `}</style>

        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <Link to="/menu" className="btn-primary">Go to Menu</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .cart-container {
          min-height: calc(100vh - 72px);
          padding: 28px 36px;
          background: linear-gradient(180deg,#0a0806 0%, #0f0c09 100%);
          color: rgba(255,255,255,0.92);
          font-family: 'DM Sans', sans-serif;
        }
        .cart-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .cart-content h1 { font-family: 'Playfair Display', serif; color: #e8c97a; margin-bottom: 14px; }

        .cart-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border: 0.5px solid rgba(232,201,122,0.06);
          padding: 12px;
          border-radius: 10px;
        }

        .item-info h3 { margin: 0; font-size: 15px; color: rgba(255,255,255,0.94); }
        .item-info p { margin: 4px 0 0; color: rgba(232,201,122,0.6); }

        .item-actions { display: flex; gap: 12px; align-items: center; }

        .btn-delete {
          background: rgba(255,107,107,0.12);
          border: 0.5px solid rgba(255,107,107,0.18);
          color: #ff6b6b;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
        }

        .cart-summary { display:flex; justify-content:space-between; align-items:center; gap:12px; }

        .btn-primary {
          padding: 10px 16px;
          background: linear-gradient(135deg,#e8c97a,#f0d88e);
          color: #0f0c09;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width:640px){ 
          .cart-container{padding:20px 16px;} 
          .cart-item{flex-direction:column;align-items:flex-start;gap:12px;} 
          .item-actions{width:100%;justify-content:space-between;} 
          .cart-summary{flex-direction:column;align-items:flex-start;gap:16px;} 
          .btn-primary{width:100%;text-align:center;box-sizing:border-box;} 
        }
      `}</style>

      <div className="cart-container">
        <div className="cart-content">
          <h1>Your Cart</h1>
        <div className="cart-items">
          {cart.map((item) => {
            const stock = item.stock ?? item.inventory ?? item.quantity_available ?? null;
            const canIncrease = stock == null ? true : item.quantity < stock;
            return (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p style={{ marginBottom: 8 }}>{formatCurrencyPHP(item.price)} x {item.quantity}</p>
                  <div style={{ fontSize: 13, color: 'rgba(232,201,122,0.6)' }}>
                    Stock: {stock == null ? 'N/A' : stock}
                  </div>
                </div>
                <div className="item-actions">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="btn-delete"
                    >
                      -
                    </button>
                    <div style={{ minWidth: 28, textAlign: 'center' }}>{item.quantity}</div>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="btn-add"
                      disabled={!canIncrease}
                      style={{ padding: '6px 10px' }}
                    >
                      +
                    </button>
                  </div>
                  <span>{formatCurrencyPHP(item.price * item.quantity)}</span>
                  <button onClick={() => removeFromCart(item.id)} className="btn-delete">
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cart-summary">
          <h2>Total: {formatCurrencyPHP(totalAmount)}</h2>
          <Link to="/checkout" className="btn-primary">Proceed to Checkout</Link>
        </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
