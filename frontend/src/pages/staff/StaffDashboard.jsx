import React, { useState, useEffect, useContext } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import formatCurrencyPHP from '../../utils/currency';

const StaffDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCancelled, setShowCancelled] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders');
      const payload = res.data;
      const orders = Array.isArray(payload) ? payload : (payload && payload.data) ? payload.data : [];
      setOrders(orders);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error('Unauthorized. Please log in as staff/admin.');
      } else {
        toast.error('Failed to load orders');
      }
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    let prevStatus = null;
    try {
      // capture previous status so we can revert if API fails
      prevStatus = (orders.find(o => o.id === orderId) || {}).status;
      // Optimistically update local orders state so UI reflects change immediately
      setOrders(prev => prev.map(o => o.id === orderId ? ({ ...o, status: newStatus }) : o));
      // mark updating
      setUpdatingIds(prev => Array.from(new Set([...prev, orderId])));
      // call API and use its returned updated order object to ensure full consistency
      const res = await API.put(`/orders/${orderId}/status`, { status: newStatus });
      const updatedOrder = res?.data;
      if (updatedOrder) {
        setOrders(prev => prev.map(o => o.id === orderId ? ({ ...o, ...updatedOrder }) : o));
      }
      toast.success(`Order status updated to ${newStatus}`);
      // broadcast update for other tabs (admin view) to pick up immediately
      try {
        localStorage.setItem('order_update', JSON.stringify({ id: orderId, ts: Date.now() }));
      } catch (e) {
        // ignore storage errors (e.g., private mode)
      }
      // refresh in background to ensure latest data
      fetchOrders();
    } catch (err) {
      console.error('updateStatus error', err);
      // revert optimistic update on failure
      const msg = err?.response?.data?.message || err.message || 'Failed to update status';
      // Check if payment verification is required
      if (err?.response?.data?.requires_verification) {
        toast.error('Payment must be verified before preparing order');
      } else {
        toast.error(msg);
      }
      if (prevStatus !== null) {
        setOrders(prev => prev.map(o => o.id === orderId ? ({ ...o, status: prevStatus }) : o));
      }
    } finally {
      setUpdatingIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const allowedTransitions = {
    Pending: ['Preparing', 'Cancelled'],
    Preparing: ['Ready for Pickup', 'Served', 'Out for Delivery', 'Cancelled'],
    'Ready for Pickup': ['Completed', 'Cancelled'],
    'Served': ['Completed', 'Cancelled'],
    'Out for Delivery': ['Delivered'],
    Delivered: ['Completed'],
    Completed: [],
    Cancelled: []
  };

  const { user } = useContext(AuthContext);

  const nextActionsFor = (order) => {
    const next = allowedTransitions[order.status] || [];
    const orderType = order.order_type || 'Pickup';
    // Filter out order-type-specific statuses that don't apply
    return next.filter(s => {
      if (s === 'Out for Delivery' || s === 'Delivered') {
        return orderType === 'Delivery';
      }
      if (s === 'Ready for Pickup') {
        return orderType === 'Pickup';
      }
      if (s === 'Served') {
        return orderType === 'Dine-in';
      }
      return true;
    });
  };

  const verifyPayment = async (orderId, action) => {
    try {
      const payment_status = action === 'verify' ? 'Paid' : 'Rejected';
      await API.put(`/orders/${orderId}/payment`, { payment_status });
      toast.success(`Payment ${payment_status}`);
      fetchOrders();
    } catch (err) {
      console.error('verifyPayment error', err);
      const msg = err?.response?.data?.message || err.message || 'Failed to update payment';
      toast.error(msg);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .staff-dashboard { min-height: calc(100vh - 72px); padding:28px 36px; background: linear-gradient(180deg,#0a0806 0%, #0f0c09 100%); color: rgba(255,255,255,0.92); font-family: 'DM Sans', sans-serif }
        .staff-dashboard h1 { font-family:'Playfair Display', serif; color:#e8c97a; margin-bottom:12px }

        .orders-list { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 16px; 
        }
        .order-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(232,201,122,0.06); padding:16px; border-radius:10px; display: flex; flex-direction: column; }
        .order-header { display:flex; justify-content:space-between; align-items:center }
        .order-header h3 { margin:0; }
        .order-status { background: rgba(232,201,122,0.08); color:#e8c97a; padding:6px 10px; border-radius:8px; font-weight:700 }

        .order-body p { margin:6px 0 }
        .order-items { margin-top:8px; display:flex; gap:8px; flex-wrap:wrap }
        .order-item { background: rgba(255,255,255,0.03); padding:6px 10px; border-radius:8px }

        .order-actions { display:flex; gap:8px; margin-top: auto; padding-top: 12px; flex-wrap: wrap; }
        .btn-verify, .btn-preparing, .btn-ready, .btn-complete, .btn-reject { padding:8px 12px; border-radius:8px; border:none; cursor:pointer; flex: 1; text-align: center; font-size: 13px; font-weight: 500; }
        .btn-verify { background: linear-gradient(135deg,#e8c97a,#f0d88e); color:#0f0c09 }
        .btn-reject { background: rgba(255,107,107,0.12); color:#ff6b6b; border:0.5px solid rgba(255,107,107,0.18) }

        @media (max-width:640px){ 
          .staff-dashboard{padding:20px 16px;} 
          .orders-list { grid-template-columns: 1fr; }
          .order-card{padding:14px;} 
          .staff-dashboard select { width: 100%; box-sizing: border-box; padding: 10px; border-radius: 8px; margin-bottom: 8px; background: rgba(255,255,255,0.04); color: white; border: 0.5px solid rgba(255,255,255,0.1); }
        }
      `}</style>

      <div className="staff-dashboard">
        <h1>Incoming Orders</h1>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Served">Served</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Completed">Completed</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
            Show Cancelled
          </label>
        </div>
        <div className="orders-list">
          {orders
            .filter(order => {
              const orderDate = new Date(order.created_at);
              const now = new Date();
              if (dateFilter === 'today') {
                return orderDate.toDateString() === now.toDateString();
              } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return orderDate >= weekAgo;
              } else if (dateFilter === 'month') {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                return orderDate >= monthAgo;
              }
              return true;
            })
            .filter(order => statusFilter === 'all' || order.status === statusFilter)
            .filter(order => showCancelled || order.status !== 'Cancelled')
            .map(order => (
              <div key={order.id} className={`order-card status-${order.status.toLowerCase()}`}>
                <div className="order-header">
                  <h3>{order.order_number}</h3>
                  <span className="order-status">{order.status}</span>
                </div>
                <div className="order-body">
                  <p><strong>Customer:</strong> {order.customer_name}</p>
                  {order.order_type === 'Delivery' && (
                    <>
                      <p><strong>Contact:</strong> {order.contact_number}</p>
                      <p><strong>Address:</strong> {order.address}</p>
                      <p><strong>Landmark:</strong> {order.landmark}</p>
                      <p><strong>Payment:</strong> {order.payment_method} ({order.payment_status || 'N/A'})</p>
                      {order.payment_proof && (
                        <p><a href={order.payment_proof} target="_blank" rel="noreferrer">View Payment Proof</a></p>
                      )}
                      {order.status === 'Cancelled' && (
                        <p><strong>Cancellation:</strong> {order.cancellation_reason || '—'}{order.cancellation_time && (
                          <span> — {new Date(order.cancellation_time).toLocaleString()}</span>
                        )}</p>
                      )}
                    </>
                  )}
                  <p><strong>Total:</strong> {formatCurrencyPHP(order.total_amount)}</p>
                  {/* Order Timestamps */}
                  <div style={{ marginTop: 8, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    <div>Placed: {new Date(order.created_at).toLocaleString()}</div>
                    {order.delivery_started_at && <div>Delivery Started: {new Date(order.delivery_started_at).toLocaleString()}</div>}
                    {order.delivered_at && <div>Delivered: {new Date(order.delivered_at).toLocaleString()}</div>}
                    {order.status === 'Completed' && order.updated_at && <div>Completed: {new Date(order.updated_at).toLocaleString()}</div>}
                  </div>
                  <div className="order-items">
                    {order.order_items.map(item => (
                      <div key={item.id} className="order-item">
                        {item.products.name} x {item.quantity}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="order-actions">
                  {order.order_type === 'Delivery' && order.payment_status === 'Pending Verification' && (
                    <>
                      <button onClick={() => verifyPayment(order.id, 'verify')} className="btn-verify">Verify Payment</button>
                      <button onClick={() => verifyPayment(order.id, 'reject')} className="btn-reject">Reject Payment</button>
                    </>
                  )}
                  {order.status === 'Pending' && (
                    <button disabled={updatingIds.includes(order.id)} onClick={() => updateStatus(order.id, 'Preparing')} className="btn-preparing">Start Preparing</button>
                  )}

                  {order.status === 'Preparing' && (
                    order.order_type === 'Delivery' ? (
                      <button disabled={updatingIds.includes(order.id)} onClick={() => updateStatus(order.id, 'Out for Delivery')} className="btn-ready">Mark Out for Delivery</button>
                    ) : order.order_type === 'Dine-in' ? (
                      <button disabled={updatingIds.includes(order.id)} onClick={() => updateStatus(order.id, 'Served')} className="btn-ready">Mark Served</button>
                    ) : (
                      <button disabled={updatingIds.includes(order.id)} onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="btn-ready">Mark Ready for Pickup</button>
                    )
                  )}

                  {order.status === 'Ready for Pickup' && (
                    <button disabled={updatingIds.includes(order.id)} onClick={() => updateStatus(order.id, 'Completed')} className="btn-complete">Complete Order</button>
                  )}

                  {order.status === 'Served' && (
                    <button disabled={updatingIds.includes(order.id)} onClick={() => updateStatus(order.id, 'Completed')} className="btn-complete">Complete Order</button>
                  )}

                  {order.status === 'Out for Delivery' && (
                    <button disabled={updatingIds.includes(order.id)} onClick={() => updateStatus(order.id, 'Delivered')} className="btn-ready">Mark Delivered</button>
                  )}

                  {order.status === 'Delivered' && (
                    user && user.role === 'admin' ? (
                      <button disabled={updatingIds.includes(order.id)} onClick={() => updateStatus(order.id, 'Completed')} className="btn-complete">Complete Order</button>
                    ) : (
                      <button onClick={() => toast('Waiting for admin to finalize delivery')} className="btn-complete">Awaiting Completion</button>
                    )
                  )}

                  {/* generic actions dropdown for other allowed transitions */}
                  {nextActionsFor(order).length > 0 && (
                    <div style={{ marginLeft: 8 }}>
                      <select disabled={updatingIds.includes(order.id)} onChange={(e) => updateStatus(order.id, e.target.value)} value="">
                        <option value="">More...</option>
                        {nextActionsFor(order).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default StaffDashboard;
