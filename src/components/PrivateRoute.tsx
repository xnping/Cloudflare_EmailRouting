import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const isAuthenticated = authService.isAuthenticated();

    useEffect(() => {
        // Check authentication status
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute; 