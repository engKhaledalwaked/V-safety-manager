import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireSuperAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireSuperAdmin = false }) => {
    const { user, isSuperAdmin, isAdmin } = useAuth();

    // Not logged in - show login page
    if (!user) {
        return <LoginPage />;
    }

    // Check if user has admin role
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" dir="rtl">
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-8 rounded-2xl text-center max-w-md">
                    <div className="text-6xl mb-4">Access Denied</div>
                    <h2 className="text-2xl font-bold mb-2">Invalid Account Role</h2>
                    <p className="text-gray-400">Your account does not have admin privileges.</p>
                </div>
            </div>
        );
    }

    // Check if super admin is required
    if (requireSuperAdmin && !isSuperAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" dir="rtl">
                <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 p-8 rounded-2xl text-center max-w-md">
                    <div className="text-6xl mb-4">Super Admin Only</div>
                    <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
                    <p className="text-gray-400">This feature requires Super Admin privileges.</p>
                </div>
            </div>
        );
    }

    // All checks passed - render children
    return <>{children}</>;
};

export default ProtectedRoute;