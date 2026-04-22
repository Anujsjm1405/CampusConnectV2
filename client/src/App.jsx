import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentDashboard from './pages/StudentDashboard';

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
    
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'PROFESSOR') return <Navigate to="/professor" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    
    return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen font-sans">
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
              <Route path="/student" element={
                  <ProtectedRoute role="STUDENT">
                      <StudentDashboard />
                  </ProtectedRoute>
              } />
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
