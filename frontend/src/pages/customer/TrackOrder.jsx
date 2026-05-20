import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { queryClient } from '../../lib/queryClient';
import formatCurrencyPHP from '../../utils/currency';

const TrackOrder = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [orderLogs, setOrderLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchOrder = async (num) => {
    const orderNum = num || orderNumber;
    setLoading(true);
    try {
      if (!orderNum) {
        setOrder(null);
        setLoading(false);
        return;
      }
      const res = await API.get(`/orders/track/${orderNum}`);
      setOrder(res.data);
      // Also fetch order logs
      try {
        const logsRes = await API.get(`/orders/track/${orderNum}/logs`);
        setOrderLogs(logsRes.data || []);
      } catch (logErr) {
        console.log('No logs available');
        setOrderLogs([]);
      }
    } catch (err) {
      toast.error('Order not found');
      setOrder(null);
      setOrderLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) fetchOrder();
    const iv = setInterval(() => { if (orderNumber) fetchOrder(); }, 15000);
    return () => clearInterval(iv);
  }, [orderNumber]);

  const handleCancelSubmit = async () => {
    if (!order) return;
    if (!cancelReason || cancelReason.trim().length < 3) return toast.error('Please provide a reason (min 3 chars)');
    try {
      setCancelLoading(true);
      await API.put(`/orders/${order.id}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled');
      // Ensure product list updates to reflect restored stock
      try { queryClient.invalidateQueries(['products']); } catch (e) { console.warn('Failed to invalidate products query', e); }
      setShowCancel(false);
      setCancelReason('');
      fetchOrder(order.order_number);
    } catch (err) {
      toast.error('Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  const [input, setInput] = useState(orderNumber || '');
  const handleLookup = (e) => {
    e.preventDefault();
    if (!input) return toast.error('Enter order number');
    // navigate to param route so bookmarkable
    navigate(`/track/${input}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .track-order {
          min-height: calc(100vh - 72px);
          padding: 28px 36px;
          background: linear-gradient(180deg,#0a0806 0%, #0f0c09 100%);
          color: rgba(255,255,255,0.92);
          font-family: 'DM Sans', sans-serif;
        }
        .track-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .track-content h1 { font-family: 'Playfair Display', serif; color:#e8c97a; margin:0 0 14px; }

        .track-order form { display:flex; gap:8px; margin-bottom:12px; }
        .track-order input[type="text"], .track-order input[type="search"] { padding:8px 10px; border-radius:8px; border:0.5px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.9); }

        .btn-primary { padding:8px 12px; background: linear-gradient(135deg,#e8c97a,#f0d88e); border:none; border-radius:8px; color:#0f0c09; cursor:pointer; }
        .btn-danger { padding:8px 12px; background: rgba(255,107,107,0.12); border: 0.5px solid rgba(255,107,107,0.18); color:#ff6b6b; border-radius:8px; cursor:pointer; }

        .track-order .order-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(232,201,122,0.06); padding:14px; border-radius:10px; margin-top:12px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; }
        .modal-card { background:#13100d; color: rgba(255,255,255,0.92); padding:18px; border-radius:10px; width: 92%; max-width:480px; border:0.5px solid rgba(232,201,122,0.08); }
        .modal-card h3 { margin:0 0 8px; font-family:'Playfair Display', serif; color:#e8c97a }
        .modal-card textarea { width:100%; min-height:100px; padding:10px; border-radius:8px; background: rgba(255,255,255,0.02); border:0.5px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.92); }

        @media (max-width:640px){ 
          .track-order{padding:20px 16px;} 
          .track-order form { flex-direction: column; }
          .track-order input[type="text"], .track-order input[type="search"] { width: 100%; box-sizing: border-box; }
          .modal-card{max-width:94%;} 
        }
      `}</style>

      <div className="track-order">
        <div className="track-content">
          <h1>Track Order</h1>
      {!orderNumber && (
        <form onSubmit={handleLookup} style={{marginBottom:12}}>
          <input placeholder="Enter order number" value={input} onChange={(e)=>setInput(e.target.value)} />
          <button className="btn-primary" type="submit">Lookup</button>
        </form>
      )}
      {!order && orderNumber && <p>No order found for <strong>{orderNumber}</strong></p>}
      {order && (
        <div>
          <h2>{order.order_number}</h2>
          <p><strong>Status:</strong> {order.status}</p>
          {order.payment_status === 'Rejected' && (
            <div style={{background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', padding: '10px', borderRadius: '8px', marginBottom: 8}}>
              <strong style={{color: '#ff6b6b'}}>Payment Rejected</strong>
              <p style={{margin: '4px 0', fontSize: '14px'}}>Your payment was not accepted. Please cancel this order and place a new one with correct payment details.</p>
            </div>
          )}
          {['Pending','Preparing'].includes(order.status) || order.payment_status === 'Rejected' ? (
            <div style={{marginTop:8}}>
              <button className="btn-danger" onClick={() => setShowCancel(true)}>Cancel Order</button>
            </div>
          ) : null}
          <p><strong>Payment:</strong> {order.payment_method} — {order.payment_status || 'N/A'}</p>
          <p><strong>Customer:</strong> {order.customer_name}</p>
          {order.order_type === 'Delivery' && (
            <>
              <p><strong>Contact:</strong> {order.contact_number}</p>
              <p><strong>Address:</strong> {order.address}</p>
              <p><strong>Landmark:</strong> {order.landmark}</p>
            </>
          )}
          <div>
            <h3>Items</h3>
            {order.order_items && order.order_items.map(it => (
              <div key={it.id} style={{display:'flex',justifyContent:'space-between'}}>
                <div>{it.products?.name}</div>
                <div>{it.quantity} x {formatCurrencyPHP(it.price)}</div>
              </div>
            ))}
          </div>

          {/* Order Status Timeline */}
          {(orderLogs.length > 0 || order.status !== 'Pending') && (
            <div style={{marginTop: 16}}>
              <h3>Order Timeline</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {/* Initial order creation */}
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <span style={{color: '#4ade80'}}>&#9679;</span>
                  <span>Order Placed</span>
                  <small style={{color: 'rgba(255,255,255,0.4)'}}>
                    {new Date(order.created_at).toLocaleString()}
                  </small>
                </div>
                {/* Status change logs */}
                {orderLogs.map((log, idx) => (
                  <div key={idx} style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <span style={{color: log.new_status === 'Cancelled' ? '#ff6b6b' : '#e8c97a'}}>&#9679;</span>
                    <span>
                      {log.new_status === 'Cancelled' ? 'Order Cancelled' : `${log.old_status} → ${log.new_status}`}
                    </span>
                    <small style={{color: 'rgba(255,255,255,0.4)'}}>
                      {log.changed_at ? new Date(log.changed_at).toLocaleString() : ''}
                    </small>
                  </div>
                ))}
                {/* Current status if no logs */}
                {orderLogs.length === 0 && order.status !== 'Pending' && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <span style={{color: '#e8c97a'}}>&#9679;</span>
                    <span>Status: {order.status}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showCancel && (
        <div className="modal-overlay" onClick={() => setShowCancel(false)}>
          <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
            <h3>Cancel Order {order?.order_number}</h3>
            <p>Provide a reason for cancelling your order:</p>
            <textarea value={cancelReason} onChange={(e)=>setCancelReason(e.target.value)} />
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
              <button onClick={()=>setShowCancel(false)}>Close</button>
              <button className="btn-danger" onClick={handleCancelSubmit} disabled={cancelLoading}>{cancelLoading ? 'Cancelling...' : 'Submit Cancel'}</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  );
};

export default TrackOrder;
