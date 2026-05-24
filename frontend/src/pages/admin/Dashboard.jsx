import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import StaffManagement from '../../components/admin/StaffManagement';
import formatCurrencyPHP from '../../utils/currency';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0 });
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', image_url: '', imageFile: null, status: 'available', id: null });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, productsRes, ordersRes] = await Promise.all([
          API.get('/reports/sales'),
          API.get('/products'),
          API.get('/orders')
        ]);
        // Use sales report for totalSales
        const totalSales = (salesRes.data && salesRes.data.totalSales) ? salesRes.data.totalSales : 0;
        // Use pagination total from /orders for the true all-time order count
        const orderCount = (ordersRes.data && ordersRes.data.pagination) ? ordersRes.data.pagination.total : 0;
        setStats({ totalSales, orderCount });
        setProducts(productsRes.data || []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };
    fetchData();
  }, []);

  const handleProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imageFile') {
      return setProductForm({ ...productForm, imageFile: files[0] });
    }
    setProductForm({ ...productForm, [name]: value });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = productForm.image_url;
      // If a new image file is provided, upload it first
      if (productForm.imageFile) {
        const formData = new FormData();
        formData.append('image', productForm.imageFile);
        if (editing && productForm.id) formData.append('id', productForm.id);
        const uploadRes = await API.post('/products/upload', formData);
        imageUrl = uploadRes.data.image_url || uploadRes.data.publicUrl || uploadRes.data.image_url;
      }

      if (editing) {
        const res = await API.put(`/products/${productForm.id}`, {
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock, 10),
          image_url: imageUrl,
          status: productForm.status
        });
        setProducts((p) => p.map((it) => (it.id === res.data.id ? res.data : it)));
        toast.success('Product updated');
      } else {
        const res = await API.post('/products', {
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock, 10),
          image_url: imageUrl,
          status: productForm.status
        });
        setProducts((p) => [res.data, ...p]);
        toast.success('Product created');
      }
      setProductForm({ name: '', description: '', price: '', stock: '', image_url: '', status: 'available', id: null });
      setEditing(false);
    } catch (err) {
      toast.error('Failed to save product');
    }
  };

  const handleEditProduct = (product) => {
    setProductForm({ name: product.name, description: product.description || '', price: product.price || '', stock: product.stock || 0, image_url: product.image_url || '', status: product.status || 'available', id: product.id });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      setProducts((p) => p.filter((it) => it.id !== id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <>
      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #0a0806;
          padding: 48px 24px;
          font-family: 'DM Sans', sans-serif;
        }

        .dashboard-header {
          margin-bottom: 48px;
        }

        .dashboard-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          color: #e8c97a;
          letter-spacing: 0.02em;
          margin: 0 0 8px;
        }

        .dashboard-header p {
          font-size: 13px;
          color: rgba(232,201,122,0.6);
          letter-spacing: 0.05em;
          margin: 0;
        }

        .dashboard-nav {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          gap: 24px;
          flex-wrap: wrap;
        }

        .btn-delivery {
          background: #e8c97a;
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0f0c09;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-delivery:hover {
          background: #f0d88e;
          transform: translateY(-2px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(232,201,122,0.08) 0%, rgba(232,201,122,0.04) 100%);
          border: 0.5px solid rgba(232,201,122,0.15);
          border-radius: 12px;
          padding: 28px;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200px;
          height: 200px;
          background-color: rgba(232,201,122,0.05);
          border-radius: 50%;
          pointer-events: none;
        }

        .stat-content {
          position: relative;
          z-index: 1;
        }

        .stat-label {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(232,201,122,0.6);
          margin: 0 0 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #e8c97a;
          margin: 0;
          letter-spacing: 0.01em;
        }

        .admin-section {
          margin-bottom: 48px;
        }

        .admin-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #e8c97a;
          letter-spacing: 0.02em;
          margin: 0 0 12px;
        }

        .admin-section p {
          font-size: 13px;
          color: rgba(232,201,122,0.6);
          letter-spacing: 0.05em;
          margin: 0 0 28px;
        }

        .product-form {
          background: linear-gradient(135deg, rgba(232,201,122,0.08) 0%, rgba(232,201,122,0.04) 100%);
          border: 0.5px solid rgba(232,201,122,0.15);
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 28px;
        }

        .product-form h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #e8c97a;
          margin: 0 0 20px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .form-wrapper {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          align-items: end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(232,201,122,0.5);
        }

        .form-input,
        .form-select {
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.85);
          outline: none;
          transition: all 0.2s;
          width: 100%;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus {
          border-color: rgba(232,201,122,0.45);
          background: rgba(232,201,122,0.04);
        }

        .form-input::placeholder {
          color: rgba(255,255,255,0.16);
        }

        .form-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-submit,
        .btn-cancel {
          padding: 12px 24px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-submit {
          background: #e8c97a;
          color: #0f0c09;
        }

        .btn-submit:hover {
          background: #f0d88e;
        }

        .btn-cancel {
          background: rgba(232,201,122,0.1);
          color: #e8c97a;
          border: 0.5px solid rgba(232,201,122,0.3);
        }

        .btn-cancel:hover {
          background: rgba(232,201,122,0.15);
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
          border: 0.5px solid rgba(232,201,122,0.15);
          background: linear-gradient(135deg, rgba(232,201,122,0.04) 0%, rgba(232,201,122,0.02) 100%);
        }

        .admin-table {
          width: 100%;
          min-width: 600px;
          border-collapse: collapse;
        }

        .admin-table thead {
          background: rgba(232,201,122,0.08);
          border-bottom: 0.5px solid rgba(232,201,122,0.15);
        }

        .admin-table th {
          padding: 16px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #e8c97a;
          text-align: left;
        }

        .admin-table td {
          padding: 16px;
          font-size: 14px;
          color: rgba(255,255,255,0.75);
          border-bottom: 0.5px solid rgba(232,201,122,0.08);
        }

        .admin-table tbody tr:hover {
          background: rgba(232,201,122,0.04);
        }

        .table-actions {
          display: flex;
          gap: 8px;
        }

        .btn-edit,
        .btn-delete {
          padding: 6px 12px;
          border: 0.5px solid rgba(232,201,122,0.3);
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
        }

        .btn-edit {
          color: #e8c97a;
        }

        .btn-edit:hover {
          background: rgba(232,201,122,0.15);
          border-color: rgba(232,201,122,0.5);
        }

        .btn-delete {
          color: #ff6b6b;
          border-color: rgba(255,107,107,0.3);
        }

        .btn-delete:hover {
          background: rgba(255,107,107,0.15);
          border-color: rgba(255,107,107,0.5);
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: rgba(232,201,122,0.5);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .admin-dashboard { padding: 24px 16px; }
          .stats-grid { grid-template-columns: 1fr; }
          .dashboard-header h1 { font-size: 32px; }
          .form-wrapper { grid-template-columns: 1fr; }
          .btn-delivery { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage your café operations and inventory</p>
          </div>
        </div>

        <div className="dashboard-nav">
          <div></div>
          <Link to="/admin/deliveries" className="btn-delivery">
            🚚 Delivery Orders
          </Link>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-label">Total Sales</p>
              <p className="stat-value">{formatCurrencyPHP(stats.totalSales)}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-label">Total Orders</p>
              <p className="stat-value">{stats.orderCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-label">Total Products</p>
              <p className="stat-value">{products.length}</p>
            </div>
          </div>
        </div>

        <section className="admin-section">
          <h2>Product Management</h2>
          <p>Add, edit, and manage your product inventory</p>

          <form className="product-form" onSubmit={handleProductSubmit}>
            <h3>{editing ? 'Edit Product' : 'Add New Product'}</h3>
            <div className="form-wrapper">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text"
                  name="name" 
                  placeholder="Enter name" 
                  value={productForm.name} 
                  onChange={handleProductChange} 
                  className="form-input"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price</label>
                <input 
                  type="number"
                  name="price" 
                  placeholder="0.00" 
                  value={productForm.price} 
                  onChange={handleProductChange}
                  step="0.01"
                  className="form-input"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock</label>
                <input 
                  type="number"
                  name="stock" 
                  placeholder="0" 
                  value={productForm.stock} 
                  onChange={handleProductChange}
                  className="form-input"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  name="status" 
                  value={productForm.status} 
                  onChange={handleProductChange}
                  className="form-select"
                >
                  <option value="available">Available</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Image</label>
                <input 
                  type="file" 
                  name="imageFile" 
                  accept="image/*" 
                  onChange={handleProductChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text"
                  name="description" 
                  placeholder="Enter description" 
                  value={productForm.description} 
                  onChange={handleProductChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-buttons" style={{marginTop: '24px'}}>
              {editing && (
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => { 
                    setEditing(false); 
                    setProductForm({ name: '', description: '', price: '', stock: '', image_url: '', imageFile: null, status: 'available', id: null }); 
                  }}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-submit">
                {editing ? '✏️ Update Product' : '➕ Create Product'}
              </button>
            </div>
          </form>

          {products.length > 0 ? (
            <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{formatCurrencyPHP(product.price)}</td>
                    <td>{product.stock}</td>
                    <td style={{color: product.status === 'available' ? '#51cf66' : '#ff6b6b'}}>{product.status}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditProduct(product)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteProduct(product.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="empty-state">
              No products yet. Add one to get started!
            </div>
          )}
        </section>

        <StaffManagement />
      </div>
    </>
  );
};

export default AdminDashboard;
