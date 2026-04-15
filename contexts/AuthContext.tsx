import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, get, update, push } from 'firebase/database';
import { db } from '../firebaseConfig';
import { getClientId } from '../utils/identity';
import { hashPassword, verifyPassword } from '../shared/passwordSecurity';

interface AdminUser {
    email: string;
    password: string;
    role: 'admin' | 'superadmin';
}

interface AuthContextType {
    user: Omit<AdminUser, 'password'> | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    loginAttempts: number;
    isBlocked: boolean;
    blockTimeRemaining: number;
}

interface StoredSession {
    user: Omit<AdminUser, 'password'>;
    expiresAt: number;
    clientId: string;
}

const normalizeRole = (role: unknown): string => {
    return String(role || '')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]/g, '');
};

const isSuperAdminRole = (role: unknown): boolean => normalizeRole(role) === 'superadmin';
const isAdminRole = (role: unknown): boolean => {
    const normalized = normalizeRole(role);
    return normalized === 'admin' || normalized === 'superadmin';
};

const AuthContext = createContext<AuthContextType | null>(null);

const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day
const SESSION_STORAGE_KEY = 'dashboard_session';
const WHITELISTED_PUBLIC_IPS = new Set(['176.28.255.49']);

const normalizePublicIp = (ip: string): string => {
    const normalized = String(ip || '').trim();
    const ipv4Match = normalized.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    return ipv4Match ? ipv4Match[1] : normalized;
};

const isWhitelistedIp = (ip: string): boolean => {
    const normalizedIp = normalizePublicIp(ip);
    return normalizedIp.length > 0 && WHITELISTED_PUBLIC_IPS.has(normalizedIp);
};

const normalizeEmail = (value: string): string => {
    return String(value || '').trim().toLowerCase();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Omit<AdminUser, 'password'> | null>(null);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

    // Check if user is blocked on mount
    useEffect(() => {
        const clientId = getClientId();

        // Check local storage for login attempts
        const storedAttempts = localStorage.getItem('dashboard_login_attempts');
        const storedBlockTime = localStorage.getItem('dashboard_block_until');

        if (storedAttempts) {
            setLoginAttempts(parseInt(storedAttempts));
        }

        if (storedBlockTime) {
            const blockUntil = parseInt(storedBlockTime);
            if (Date.now() < blockUntil) {
                setIsBlocked(true);
                const remaining = blockUntil - Date.now();
                setBlockTimeRemaining(remaining);
            } else {
                // Block expired, clear it
                localStorage.removeItem('dashboard_block_until');
                localStorage.removeItem('dashboard_login_attempts');
                setLoginAttempts(0);
            }
        }

        // Check localStorage for existing session (persistent login)
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
            try {
                const session: StoredSession = JSON.parse(savedSession);
                // Check if session is expired
                if (Date.now() < session.expiresAt && session.clientId === clientId) {
                    // Session is valid, restore user
                    setUser(session.user);
                } else {
                    // Session expired or different client, clear it
                    localStorage.removeItem(SESSION_STORAGE_KEY);
                }
            } catch (e) {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }
        }
    }, []);

    const getPublicIp = async (): Promise<string> => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json() as { ip?: string };
            return String(data?.ip || '').trim();
        } catch {
            return '';
        }
    };

    // Update block time remaining
    useEffect(() => {
        if (isBlocked && blockTimeRemaining > 0) {
            const interval = setInterval(() => {
                const storedBlockTime = localStorage.getItem('dashboard_block_until');
                if (storedBlockTime) {
                    const blockUntil = parseInt(storedBlockTime);
                    const remaining = blockUntil - Date.now();
                    if (remaining <= 0) {
                        setIsBlocked(false);
                        setBlockTimeRemaining(0);
                        setLoginAttempts(0);
                        localStorage.removeItem('dashboard_block_until');
                        localStorage.removeItem('dashboard_login_attempts');
                    } else {
                        setBlockTimeRemaining(remaining);
                    }
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isBlocked, blockTimeRemaining]);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const publicIp = await getPublicIp();
        const isWhitelisted = isWhitelistedIp(publicIp);
        const normalizedEmail = normalizeEmail(email);
        const normalizedPassword = String(password || '');

        if (!normalizedEmail || !normalizedPassword) {
            return {
                success: false,
                error: 'Email and password are required.'
            };
        }

        if (isBlocked && isWhitelisted) {
            setIsBlocked(false);
            setBlockTimeRemaining(0);
            setLoginAttempts(0);
            localStorage.removeItem('dashboard_block_until');
            localStorage.removeItem('dashboard_login_attempts');
        } else if (isBlocked) {
            const remainingMinutes = Math.ceil(blockTimeRemaining / 60000);
            return {
                success: false,
                error: `You are blocked. Try again in ${remainingMinutes} minutes.`
            };
        }

        if (!db) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const adminRef = ref(db, 'adminUsers');
            const snapshot = await get(adminRef);
            const data = snapshot.val() as Record<string, Partial<AdminUser>> | null;

            if (!data || typeof data !== 'object') {
                return { success: false, error: 'No admin users configured' };
            }

            let matchedUserKey: string | null = null;
            let matchedUser: AdminUser | null = null;
            let needsPasswordUpgrade = false;

            for (const [userKey, rawUser] of Object.entries(data)) {
                const candidateEmail = normalizeEmail(String(rawUser?.email || ''));
                if (candidateEmail !== normalizedEmail) {
                    continue;
                }

                const storedPassword = String(rawUser?.password || '');
                const verification = await verifyPassword(normalizedPassword, storedPassword);

                if (!verification.matched) {
                    continue;
                }

                matchedUserKey = userKey;
                matchedUser = {
                    email: candidateEmail,
                    password: storedPassword,
                    role: rawUser?.role === 'superadmin' ? 'superadmin' : 'admin'
                };
                needsPasswordUpgrade = verification.needsUpgrade;
                break;
            }

            if (matchedUser && matchedUserKey) {
                const clientId = getClientId();
                const now = Date.now();
                const userData = { email: matchedUser.email, role: matchedUser.role };

                // Create session with expiration
                const session: StoredSession = {
                    user: userData,
                    expiresAt: now + SESSION_DURATION_MS,
                    clientId: clientId
                };

                setUser(userData);
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

                // Reset attempts
                setLoginAttempts(0);
                localStorage.removeItem('dashboard_login_attempts');
                localStorage.removeItem('dashboard_block_until');

                // Migrate legacy plaintext passwords to hash format after successful login.
                if (needsPasswordUpgrade) {
                    try {
                        const passwordHash = await hashPassword(normalizedPassword);
                        await update(ref(db, `adminUsers/${matchedUserKey}`), {
                            password: passwordHash,
                            updatedAt: now
                        });
                    } catch (error) {
                        console.warn('Failed to upgrade admin password hash:', error);
                    }
                }

                try {
                    await update(ref(db, `adminUsers/${matchedUserKey}`), {
                        lastLogin: now
                    });
                } catch (error) {
                    console.warn('Failed to update last login timestamp:', error);
                }

                try {
                    const loginHistoryRef = ref(db, 'dashboardLoginHistory');
                    await push(loginHistoryRef, {
                        email: matchedUser.email,
                        role: matchedUser.role,
                        clientId: clientId,
                        timestamp: now,
                        date: new Date(now).toISOString(),
                        action: 'login'
                    });
                } catch (error) {
                    console.warn('Failed to store dashboard login history entry:', error);
                }

                return { success: true };
            }

            // Failed login
            const persistedAttempts = Number(localStorage.getItem('dashboard_login_attempts') || loginAttempts || 0);
            const newAttempts = persistedAttempts + 1;

            setLoginAttempts(newAttempts);
            localStorage.setItem('dashboard_login_attempts', newAttempts.toString());

            if (newAttempts >= MAX_LOGIN_ATTEMPTS && !isWhitelisted) {
                // Block the user
                const blockUntil = Date.now() + BLOCK_DURATION_MS;
                setIsBlocked(true);
                setBlockTimeRemaining(BLOCK_DURATION_MS);
                localStorage.setItem('dashboard_block_until', blockUntil.toString());

                // Log blocked attempt to database
                const clientId = getClientId();
                const blockedRef = ref(db, 'dashboardBlocked');

                try {
                    await push(blockedRef, {
                        ip: clientId,
                        email: normalizedEmail,
                        timestamp: Date.now(),
                        blockUntil: blockUntil
                    });
                } catch (error) {
                    console.warn('Failed to store dashboard blocked login attempt:', error);
                }

                return {
                    success: false,
                    error: 'Too many failed attempts. You are blocked for 30 minutes.'
                };
            }

            const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
            return {
                success: false,
                error: `Invalid credentials. ${remaining} attempt(s) remaining.`
            };
        } catch (error) {
            console.error('Dashboard login failed:', error);
            return {
                success: false,
                error: 'Unexpected error during login. Please try again.'
            };
        }
    };

    const logout = () => {
        // Log logout to Firebase before clearing
        if (user && db) {
            const clientId = getClientId();
            const loginHistoryRef = ref(db, 'dashboardLoginHistory');
            push(loginHistoryRef, {
                email: user.email,
                role: user.role,
                clientId: clientId,
                timestamp: Date.now(),
                date: new Date().toISOString(),
                action: 'logout'
            });
        }

        setUser(null);
        localStorage.removeItem(SESSION_STORAGE_KEY);
    };

    const userRole = user?.role;

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isSuperAdmin: isSuperAdminRole(userRole),
            isAdmin: isAdminRole(userRole),
            loginAttempts,
            isBlocked,
            blockTimeRemaining,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};