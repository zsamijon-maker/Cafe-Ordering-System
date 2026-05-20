import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import API from '../../services/api';
import toast from 'react-hot-toast';
import formatCurrencyPHP from '../../utils/currency';
import { queryClient } from '../../lib/queryClient';

const DELIVERY_FEE = 35; // Fixed delivery fee in PHP

const Checkout = () => {
  const { cart, totalAmount, clearCart } = useContext(CartContext);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Pickup');
  const [tableNumber, setTableNumber] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const navigate = useNavigate();

  // Adjust payment method when order type changes
  useEffect(() => {
    if (orderType === 'Dine-in' || orderType === 'Pickup') {
      if (paymentMethod === 'Cash on Delivery') {
        setPaymentMethod('Cash');
      }
    } else if (orderType === 'Delivery') {
      if (paymentMethod === 'Cash') {
        setPaymentMethod('Cash on Delivery');
      }
    }
  }, [orderType]);

  // Calculate total with delivery fee
  const calculateTotal = () => {
    let total = totalAmount;
    if (orderType === 'Delivery') {
      total += DELIVERY_FEE;
    }
    return total;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      if (cart.length === 0) return;

      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      // Use FormData if there's a file or to support multipart fields
      const formData = new FormData();
      formData.append('customer_name', customerName);
      formData.append('items', JSON.stringify(items));
      formData.append('total_amount', calculateTotal());
      formData.append('payment_method', paymentMethod);
      formData.append('order_type', orderType);
      formData.append('delivery_fee', orderType === 'Delivery' ? DELIVERY_FEE : 0);
      if (orderType === 'Dine-in') formData.append('table_number', tableNumber);
      if (orderType === 'Delivery') {
        formData.append('address', address);
        formData.append('landmark', landmark);
        formData.append('contact_number', contactNumber);
        formData.append('notes', notes);
      }
      if (paymentReference) formData.append('payment_reference', paymentReference);
      if (paymentProofFile) formData.append('payment_proof', paymentProofFile);

      const res = await API.post('/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const createdOrder = res.data;
      toast.success('Order placed successfully!');
      clearCart();
      // Ensure menu/products data is refreshed to reflect reduced stock
      try { queryClient.invalidateQueries(['products']); } catch (e) { console.warn('Failed to invalidate products query', e); }
      // Navigate to track page with order number
      if (createdOrder && createdOrder.order_number) {
        navigate(`/track/${createdOrder.order_number}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      // Check for stock validation errors
      if (err.response?.data?.out_of_stock?.length > 0) {
        const outOfStock = err.response.data.out_of_stock;
        const names = outOfStock.map(o => o.name || o.product_id).join(', ');
        toast.error(`Out of stock: ${names}`);
      } else if (err.response?.data?.insufficient_stock?.length > 0) {
        const insufficient = err.response.data.insufficient_stock;
        const messages = insufficient.map(i => `${i.name}: ${i.message}`).join(', ');
        toast.error(`Insufficient stock: ${messages}`);
      } else {
        toast.error('Failed to place order');
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .checkout-container {
          min-height: calc(100vh - 72px);
          padding: 28px 36px;
          background: linear-gradient(180deg,#0a0806 0%, #0f0c09 100%);
          color: rgba(255,255,255,0.92);
          font-family: 'DM Sans', sans-serif;
        }
        .checkout-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .checkout-content h1 { font-family: 'Playfair Display', serif; color: #e8c97a; margin-bottom: 12px; }

        .checkout-form { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.02); padding: 24px; border-radius: 12px; border: 0.5px solid rgba(232,201,122,0.06); }

        .form-group { margin-bottom: 14px; display:flex; flex-direction:column; gap:8px; }
        .form-group label { font-size: 12px; color: rgba(232,201,122,0.7); text-transform: uppercase; letter-spacing: 0.12em; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 0.5px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.92); }

        .order-summary { margin: 16px 0; font-weight: 700; color: #e8c97a; }

        .btn-primary { width: 100%; padding: 14px 18px; background: linear-gradient(135deg,#e8c97a,#f0d88e); color:#0f0c09; border-radius:10px; border:none; cursor:pointer; font-weight:700; text-transform: uppercase; letter-spacing: 0.05em;}

        @media (max-width:640px){ 
          .checkout-container{padding:20px 16px;} 
          .checkout-form{padding:16px;} 
        }
      `}</style>

      <div className="checkout-container">
        <div className="checkout-content">
          <h1>Checkout</h1>
        <form onSubmit={handleCheckout} className="checkout-form">
          <div className="form-group">
            <label>Customer Name</label>
            <input 
              type="text" 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Order Type</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <option value="Pickup">Pickup</option>
              <option value="Dine-in">Dine-in</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>

          {orderType === 'Dine-in' && (
            <div className="form-group">
              <label>Table Number</label>
              <input type="text" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} required />
            </div>
          )}

          {orderType === 'Delivery' && (
            <>
              <div className="form-group">
                <label>Contact Number</label>
                <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Complete Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Landmark</label>
                <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {orderType === 'Delivery' ? (
                <option value="Cash on Delivery">Cash on Delivery</option>
              ) : (
                <option value="Cash">Cash</option>
              )}
              <option value="GCash">GCash</option>
              <option value="Maya">Maya</option>
              <option value="Card">Card</option>
            </select>
          </div>

          {(paymentMethod === 'GCash' || paymentMethod === 'Maya' || paymentMethod === 'Card') && (
            <div className="form-group">
              <label>Reference Number</label>
              <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} required />
            </div>
          )}

          {(paymentMethod === 'GCash' || paymentMethod === 'Maya') && (
            <div className="form-group">
              <label>Upload Payment Screenshot</label>
              <input type="file" accept="image/*" onChange={(e) => setPaymentProofFile(e.target.files[0])} required />
            </div>
          )}
          <div className="order-summary">
            <h3>Order Total: {formatCurrencyPHP(calculateTotal())}</h3>
            {orderType === 'Delivery' && (
              <small style={{ display: 'block', color: 'rgba(232,201,122,0.7)', marginTop: 4 }}>
                (Includes delivery fee: {formatCurrencyPHP(DELIVERY_FEE)})
              </small>
            )}
          </div>
          <button type="submit" className="btn-primary">Place Order</button>
        </form>
        </div>
      </div>
    </>
  );
};

export default Checkout;
