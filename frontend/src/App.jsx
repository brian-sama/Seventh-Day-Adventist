import React, { useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import Login from './pages/Login'
import ClerkDashboard from './pages/ClerkDashboard'
import ElderDashboard from './pages/ElderDashboard'
import PastorDashboard from './pages/PastorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Layout from './components/Layout'
import VerifyDocument from './pages/VerifyDocument'
import { Toaster } from 'react-hot-toast'

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div className="min-h-screen flex text-center items-center justify-center p-12">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Automatic redirect based on role
const DashboardRouter = () => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    
    switch(user.role) {
        case 'clerk': return <Navigate to="/clerk" replace />;
        case 'elder': return <Navigate to="/elder" replace />;
        case 'pastor': return <Navigate to="/pastor" replace />;
        case 'admin': return <Navigate to="/admin" replace />;
        default: return <Navigate to="/login" replace />;
    }
}

function App() {
  return (
    <Router>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Layout />}>
                <Route index element={
                    <ProtectedRoute>
                        <DashboardRouter />
                    </ProtectedRoute>
                } />
                <Route path="clerk" element={
                    <ProtectedRoute allowedRoles={['clerk']}>
                        <ClerkDashboard />
                    </ProtectedRoute>
                } />
                <Route path="elder" element={
                    <ProtectedRoute allowedRoles={['elder']}>
                        <ElderDashboard />
                    </ProtectedRoute>
                } />
                <Route path="pastor" element={
                    <ProtectedRoute allowedRoles={['pastor']}>
                        <PastorDashboard />
                    </ProtectedRoute>
                } />
                <Route path="admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
            </Route>

            <Route path="/verify/:uuid" element={<VerifyDocument />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  )
}

export default App
