// frontend/src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }}>Yükleniyor...</div>;
    }

    if (!user) {
        return <Navigate to="/giris-yap" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;