import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const { login, isBlocked, blockTimeRemaining, loginAttempts } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Format remaining time
    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isBlocked) {
            return;
        }

        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error || 'Login failed');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4">
                        <span className="text-4xl">shield</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">V-Safety</h1>
                    <p className="text-gray-400 mt-2">Dashboard Login</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-6 text-center">Sign in to your account</h2>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-center">
                            <span className="block text-lg font-semibold mb-1">Login Failed</span>
                            <span className="block text-sm">{error}</span>
                        </div>
                    )}

                    {/* Blocked Message */}
                    {isBlocked && (
                        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 p-4 rounded-xl mb-6 text-center">
                            <span className="block text-lg font-semibold mb-1">Account Temporarily Blocked</span>
                            <span className="block text-2xl font-bold">{formatTime(blockTimeRemaining)}</span>
                            <span className="block text-sm mt-1">Please wait before trying again</span>
                        </div>
                    )}

                    {/* Attempts Warning */}
                    {!isBlocked && loginAttempts > 0 && (
                        <div className="bg-orange-500/20 border border-orange-500/50 text-orange-400 p-3 rounded-xl mb-6 text-center text-sm">
                            Warning: {3 - loginAttempts} attempt(s) remaining before temporary block
                        </div>
                    )}

                    {/* Email Input */}
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">Email Address</label>
                        <input
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading || isBlocked}
                            className="w-full p-4 bg-gray-700/50 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm mb-2">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || isBlocked}
                            className="w-full p-4 bg-gray-700/50 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || isBlocked}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Signing in...</span>
                            </>
                        ) : isBlocked ? (
                            <span>Blocked - Please Wait</span>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Protected by V-Safety Security System
                </p>
            </div>
        </div>
    );
};

export default LoginPage;