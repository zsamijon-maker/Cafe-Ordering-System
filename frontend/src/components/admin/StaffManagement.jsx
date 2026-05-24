import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '' });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await API.get('/staff');
      setStaff(res.data || []);
    } catch (err) {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) return toast.error('Fill all fields');
    try {
      const res = await API.post('/staff', form);
      setStaff((s) => [res.data, ...s]);
      setForm({ name: '', username: '', password: '' });
      toast.success('Staff created');
    } catch (err) {
      toast.error('Failed to create staff');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this staff member?')) return;
    try {
      await API.delete(`/staff/${id}`);
      setStaff((s) => s.filter((p) => p.id !== id));
      toast.success('Staff deleted');
    } catch (err) {
      toast.error('Failed to delete staff');
    }
  };

  return (
    <>
      <style>{`
        .admin-section { min-height: calc(100vh - 72px); padding:28px 36px; background: linear-gradient(180deg,#0a0806 0%, #0f0c09 100%); color: rgba(255,255,255,0.92); font-family: 'DM Sans', sans-serif }
        .admin-section h2 { font-family:'Playfair Display', serif; color:#e8c97a; margin-bottom:12px }

        .staff-grid { display:grid; grid-template-columns: 320px 1fr; gap:20px }
        .staff-form { background: rgba(255,255,255,0.02); padding:18px; border-radius:12px; border:0.5px solid rgba(232,201,122,0.06) }
        .staff-form h3 { margin-top:0; color:#e8c97a; font-family: 'Playfair Display', serif }
        .staff-form .form-group { margin-bottom:14px; display:flex; flex-direction:column }
        .staff-form label { font-size:12px; color: rgba(232,201,122,0.7); text-transform:uppercase; letter-spacing:0.12em }
        .staff-form input { padding:12px 14px; border-radius:8px; background: rgba(255,255,255,0.04); border:0.5px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.92); width:100%; box-sizing:border-box }
        .staff-form input::placeholder { color: rgba(255,255,255,0.18) }

        /* Override browser autofill (Chrome/Safari) to match dark theme */
        input:-webkit-autofill,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:hover,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:focus {
          -webkit-text-fill-color: rgba(255,255,255,0.92) !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,0.04) inset !important;
          box-shadow: 0 0 0px 1000px rgba(255,255,255,0.04) inset !important;
        }

        .staff-form input:focus { border-color: rgba(232,201,122,0.45); background: rgba(232,201,122,0.03) }
        .btn-primary { padding:10px 14px; background: linear-gradient(135deg,#e8c97a,#f0d88e); color:#0f0c09; border:none; border-radius:8px; cursor:pointer; margin-top:6px }

        .staff-list { background: rgba(255,255,255,0.02); padding:14px; border-radius:10px; border:0.5px solid rgba(232,201,122,0.06); overflow-x: auto; }
        .admin-table { width:100%; min-width: 500px; border-collapse:collapse; }
        .admin-table th, .admin-table td { padding:10px 12px; text-align:left; border-bottom: 0.5px solid rgba(255,255,255,0.03) }
        .btn-danger { padding:8px 12px; background: rgba(255,107,107,0.12); color:#ff6b6b; border:0.5px solid rgba(255,107,107,0.18); border-radius:8px; cursor:pointer; font-weight: 500; }

        @media (max-width:900px){ .staff-grid{grid-template-columns:1fr; gap: 24px;} }
        @media (max-width:640px){ .admin-section{padding: 24px 16px;} .staff-form{padding: 20px;} }
      `}</style>

      <section className="admin-section">
        <h2>Staff Management</h2>

        <div className="staff-grid">
          <form className="staff-form" onSubmit={handleCreate}>
            <h3>Add Staff</h3>
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input name="username" value={form.username} onChange={handleChange} type="text" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" value={form.password} onChange={handleChange} type="password" />
            </div>
            <button className="btn-primary" type="submit">Create Staff</button>
          </form>

          <div className="staff-list">
            <h3>Existing Staff</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.username}</td>
                      <td>{s.role}</td>
                      <td>{new Date(s.created_at).toLocaleString()}</td>
                      <td>
                        <button className="btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default StaffManagement;
