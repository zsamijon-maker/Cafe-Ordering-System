import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { CartContext } from '../../context/CartContext';
import toast from 'react-hot-toast';
import formatCurrencyPHP from '../../utils/currency';

const Menu = () => {
  const { addToCart } = useContext(CartContext);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await API.get('/products');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Show error toast if query fails
  if (error) {
    toast.error('Failed to load menu');
  }

  const handleAddToCart = (product) => {
    const added = addToCart(product);
    if (added) {
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error(`${product.name} is out of stock or reached maximum quantity`);
    }
  };

  if (isLoading) {
    return (
      <div className="menu-container">
        <h1>Our Menu</h1>
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)' }}>
          Loading menu...
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .menu-container {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(180deg, #0a0806 0%, #0f0c09 100%);
          min-height: calc(100vh - 72px);
          margin: -24px -20px 0;
          padding: 28px 36px;
          color: rgba(255,255,255,0.9);
        }
        .menu-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .menu-content h1 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #e8c97a;
          margin: 0 0 18px;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        .product-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          border: 0.5px solid rgba(232,201,122,0.08);
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.45);
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          text-align: center;
        }

        .product-card img {
          width: 100%;
          height: 140px;
          object-fit: cover;
          border-radius: 8px;
          border: 0.5px solid rgba(232,201,122,0.06);
        }

        .product-card h3 {
          margin: 6px 0 0;
          font-size: 16px;
          color: rgba(255,255,255,0.92);
          font-weight: 600;
        }

        .product-card p {
          margin: 6px 0 10px;
          font-size: 13px;
          color: rgba(232,201,122,0.6);
          min-height: 36px;
        }

        .product-footer {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .price {
          font-weight: 700;
          color: #e8c97a;
          font-size: 15px;
        }

        .btn-add {
          padding: 8px 12px;
          background: linear-gradient(135deg, #e8c97a, #f0d88e);
          border: none;
          border-radius: 8px;
          color: #0f0c09;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
        }

        .btn-add:disabled {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.4);
          cursor: not-allowed;
          transform: none;
        }

        .btn-add:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.45);
        }

        @media (max-width: 640px) {
          .menu-container { padding: 20px 16px; }
          .product-card img { height: 120px; }
          .product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
          .btn-add { padding: 8px 10px; font-size: 13px; }
        }
      `}</style>

      <div className="menu-container">
        <div className="menu-content">
          <h1>Our Menu</h1>
        <div className="product-grid">
          {products.map((product) => {
            const stock = product.stock ?? product.inventory ?? product.quantity_available ?? null;
            const outOfStock = stock != null ? stock <= 0 : product.status === 'out_of_stock';
            return (
              <div key={product.id} className="product-card">
                <img src={product.image_url || 'https://via.placeholder.com/150'} alt={product.name} loading="lazy" />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div style={{ fontSize: 13, color: 'rgba(232,201,122,0.6)', marginBottom: 6 }}>
                  Stock: {stock == null ? 'N/A' : stock}
                </div>
                <div className="product-footer">
                  <span className="price">{formatCurrencyPHP(product.price)}</span>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="btn-add"
                    disabled={outOfStock}
                  >
                    {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </>
  );
};

export default Menu;
