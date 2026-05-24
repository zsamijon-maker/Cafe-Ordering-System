import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/auth/Login'));
const Home = lazy(() => import('./pages/customer/Home'));
const Menu = lazy(() => import('./pages/customer/Menu'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const TrackOrder = lazy(() => import('./pages/customer/TrackOrder'));
const About = lazy(() => import('./pages/customer/About'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const DeliveryOrders = lazy(() => import('./pages/admin/DeliveryOrders'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
import Navbar from './components/common/Navbar';

// Loading fallback component
const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div style={{ color: 'rgba(255,255,255,0.6)' }}>Loading...</div>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

const CustomerRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  // If logged-in user is admin or staff, redirect them away from customer pages
  if (user && ['admin', 'staff'].includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'staff') return <Navigate to="/staff" />;
  }
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>

          <Navbar />
          <div className="container">
            <Suspense fallback={<Loading />}>
              <Routes>
              {/* Home page is public for everyone */}
              <Route path="/" element={<Home />} />
              {/* Customer-only routes — redirect admin/staff away */}
              <Route path="/menu" element={<CustomerRoute><Menu /></CustomerRoute>} />
              <Route path="/about" element={<CustomerRoute><About /></CustomerRoute>} />
              <Route path="/cart" element={<CustomerRoute><Cart /></CustomerRoute>} />
              <Route path="/checkout" element={<CustomerRoute><Checkout /></CustomerRoute>} />
              <Route path="/track" element={<CustomerRoute><TrackOrder /></CustomerRoute>} />
              <Route path="/track/:orderNumber" element={<CustomerRoute><TrackOrder /></CustomerRoute>} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />

              {/* Admin Routes */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/admin/deliveries"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <DeliveryOrders />
                  </ProtectedRoute>
                }
              />

              {/* Staff Routes */}
              <Route 
                path="/staff/*" 
                element={
                  <ProtectedRoute roles={['staff', 'admin']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            </Suspense>
          </div>
          <Toaster position="top-right" />
        </Router>
      </CartProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
