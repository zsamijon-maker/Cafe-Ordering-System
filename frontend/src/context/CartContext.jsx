import React, { createContext, useState } from 'react';

// Theme helper (exported for potential use in JSX styling)
export const THEME = {
  gold: '#e8c97a',
  background: '#0f0c09',
};

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const getStockFor = (product) => {
    return (
      product?.stock ?? product?.inventory ?? product?.quantity_available ?? null
    );
  };

  const addToCart = (product) => {
    let added = false;
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const stock = getStockFor(product);

      if (existingItem) {
        const desired = existingItem.quantity + 1;
        if (stock != null && desired > stock) {
          added = false;
          return prevCart;
        }
        added = true;
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      if (stock != null && stock <= 0) {
        added = false;
        return prevCart;
      }

      added = true;
      return [...prevCart, { ...product, quantity: 1 }];
    });

    return added;
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id !== productId) return item;
        const stock = getStockFor(item);
        let qty = Math.max(1, Math.floor(newQuantity));
        if (stock != null) qty = Math.min(qty, stock);
        return { ...item, quantity: qty };
      });
    });
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};
