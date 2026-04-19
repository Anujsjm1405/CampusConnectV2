import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    
    return children;
};

const RootRedirect = () => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/professor'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={
                <ProtectedRoute role="ADMIN">
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/professor" element={
                <ProtectedRoute role="PROFESSOR">
                    <ProfessorDashboard />
                </ProtectedRoute>
            } />
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
