import React, { useState, useEffect, useContext } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import formatCurrencyPHP from '../../utils/currency';

const DeliveryOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ payment_status: 'all', status: 'all', q: '' });
  const [selectedProof, setSelectedProof] = useState(null);
  const [updatingIds, setUpdatingIds] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders');
      const payload = res.data;
      let data = Array.isArray(payload) ? payload : (payload && payload.data) ? payload.data : [];
      // filter for Delivery
      data = data.filter(o => o.order_type === 'Delivery');

      // Apply filters
      if (filters.payment_status !== 'all') data = data.filter(o => (o.payment_status || '') === filters.payment_status);
      if (filters.status !== 'all') data = data.filter(o => (o.status || '') === filters.status);
      if (filters.q) {
        const q = filters.q.toLowerCase();
        data = data.filter(o => (o.order_number || '').toLowerCase().includes(q) || (o.customer_name || '').toLowerCase().includes(q));
      }

      setOrders(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error('Unauthorized. Please log in as admin/staff.');
      } else {
        toast.error('Failed to load delivery orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 30000);
    // Listen for order updates from other tabs (e.g. staff marking Out for Delivery)
    const onStorage = (e) => {
      if (!e) return;
      try {
        if (e.key === 'order_update') {
          // refresh orders to reflect changes made elsewhere
          fetchOrders();
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('storage', onStorage);
    return () => clearInterval(iv);
    // cleanup storage listener
    // (note: returning a single cleanup; ensure listener removal)
  }, [filters]);

  // remove storage listener on unmount
  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return;
      try {
        if (e.key === 'order_update') fetchOrders();
      } catch (err) {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleVerify = async (orderId) => {
    try {
      await API.put(`/orders/${orderId}/payment`, { payment_status: 'Paid' });
      toast.success('Payment marked Paid');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to verify payment');
    }
  };

  const handleReject = async (orderId) => {
    try {
      await API.put(`/orders/${orderId}/payment`, { payment_status: 'Rejected' });
      toast.success('Payment marked Rejected');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to reject payment');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    let prevStatus = null;
    try {
      prevStatus = (orders.find(o => o.id === orderId) || {}).status;
      // Optimistically update local orders state so UI updates immediately
      setOrders(prev => prev.map(o => o.id === orderId ? ({ ...o, status: newStatus }) : o));
      // mark updating
      setUpdatingIds(prev => Array.from(new Set([...prev, orderId])));
      // call API and apply returned order object to keep full state in sync
      const res = await API.put(`/orders/${orderId}/status`, { status: newStatus });
      const updatedOrder = res?.data;
      if (updatedOrder) {
        setOrders(prev => prev.map(o => o.id === orderId ? ({ ...o, ...updatedOrder }) : o));
      }
      toast.success('Order status updated');
      // still refresh in background
      fetchOrders();
    } catch (err) {
      // Check if payment verification is required
      if (err?.response?.data?.requires_verification) {
        toast.error('Payment must be verified before preparing order');
      } else {
        toast.error('Failed to update status');
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

  const statusOptionsFor = (order) => {
    const next = allowedTransitions[order.status] || [];
    // include current status as first option so select shows it
    const opts = [order.status, ...next.filter(s => s !== order.status)];
    return opts;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .admin-section { min-height: calc(100vh - 72px); padding: 28px 36px; background: linear-gradient(180deg,#0a0806 0%, #0f0c09 100%); color: rgba(255,255,255,0.92); font-family: 'DM Sans', sans-serif; }
        .admin-section h2 { font-family: 'Playfair Display', serif; color: #e8c97a; margin-bottom:12px }

        .admin-filters { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px }
        .admin-filters select, .admin-filters input { padding:8px 10px; border-radius:8px; background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.92); }
        .btn-primary { padding:8px 12px; background: linear-gradient(135deg,#e8c97a,#f0d88e); border:none; border-radius:8px; color:#0f0c09; cursor:pointer; }
        .btn-danger { padding:8px 12px; background: rgba(255,107,107,0.12); border: 0.5px solid rgba(255,107,107,0.18); color:#ff6b6b; border-radius:8px; cursor:pointer; }

        .orders-list { display:flex; flex-direction:column; gap:12px }
        .order-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(232,201,122,0.06); padding:14px; border-radius:10px; }
        .order-card h4 { margin:0 0 6px; color: rgba(255,255,255,0.94) }
        .order-card small { color: rgba(255,255,255,0.28); margin-left:8px }

        .order-actions { display:flex; gap:8px; margin-top:8px }
        .order-actions select { padding:8px 10px; border-radius:8px; }

        .modal-overlay { position:fixed; inset:0; background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center }
        .modal-proof { background:#13100d; padding:16px; border-radius:10px; max-width:90%; max-height:90%; border:0.5px solid rgba(232,201,122,0.08); }
        .modal-proof img{ max-width:100%; max-height:80vh; display:block }

        @media (max-width:640px) { .admin-section{padding:20px} .order-card{padding:12px} }
      `}</style>

      <div className="admin-section">
        <h2>Delivery Orders & Payments</h2>

        <div className="admin-filters">
          <select value={filters.payment_status} onChange={(e) => setFilters(f => ({...f, payment_status: e.target.value}))}>
            <option value="all">All Payment Statuses</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={filters.status} onChange={(e) => setFilters(f => ({...f, status: e.target.value}))}>
            <option value="all">All Order Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Served">Served</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input placeholder="Search order# or customer" value={filters.q} onChange={(e) => setFilters(f => ({...f, q: e.target.value}))} />
          <button onClick={fetchOrders} className="btn-primary">Refresh</button>
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <div>
                    <h4>{order.order_number} <small>{new Date(order.created_at).toLocaleString()}</small></h4>
                    <p><strong>Customer:</strong> {order.customer_name} — <strong>Contact:</strong> {order.contact_number}</p>
                    <p><strong>Address:</strong> {order.address} <br /><strong>Landmark:</strong> {order.landmark}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p><strong>Total:</strong> {formatCurrencyPHP(order.total_amount)}</p>
                    <p><strong>Payment:</strong> {order.payment_method} / {order.payment_status || 'N/A'}</p>
                    <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                      <span className="order-status">{order.status}</span>
                    </div>
                    {order.status === 'Cancelled' && (
                      <p><strong>Cancellation:</strong> {order.cancellation_reason || '—'}{order.cancellation_time && (
                        <span> — {new Date(order.cancellation_time).toLocaleString()}</span>
                      )}</p>
                    )}
                    <small style={{color:'rgba(255,255,255,0.36)'}}>Last: {new Date(order.updated_at || order.delivery_started_at || order.delivered_at || order.created_at).toLocaleString()}</small>
                  </div>
                </div>

                <div className="order-actions">
                  {order.payment_proof && (
                    <button className="btn" onClick={() => setSelectedProof(order.payment_proof)}>View Proof</button>
                  )}
                  {order.payment_status === 'Pending Verification' && (
                    <>
                      <button className="btn-primary" onClick={() => handleVerify(order.id)}>Verify</button>
                      <button className="btn-danger" onClick={() => handleReject(order.id)}>Reject</button>
                    </>
                  )}

                  <select disabled={updatingIds.includes(order.id) || (allowedTransitions[order.status]||[]).length===0} value="" onChange={(e) => handleStatusChange(order.id, e.target.value)}>
                    <option value="">Status: {order.status}</option>
                    {(allowedTransitions[order.status] || []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedProof && (
          <div className="modal-overlay" onClick={() => setSelectedProof(null)}>
            <div className="modal-proof" onClick={(e)=>e.stopPropagation()}>
              <button style={{float:'right'}} onClick={() => setSelectedProof(null)}>Close</button>
              <img src={selectedProof} alt="payment proof" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeliveryOrders;
