import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { ref, onValue, remove } from 'firebase/database';
import { getClientId, getClientPublicIpDetails, setClientPublicIpDetails } from '../../shared/utils';

/**
 * BlockGuard Component
 * نظام الحظر عبر الكوكيز و localStorage و IP
 * 
 * يتحقق من:
 * 1. وجود كوكي الحظر
 * 2. وجود localStorage ID في قائمة الحظر
 * 3. حالة الحظر في Firebase
 * 
 * إذا كان المستخدم محظوراً، يتم توجيهه إلى صفحة الحظر
 */

// Cookie and localStorage constants
const BLOCK_COOKIE_NAME = 'v_safety_blocked';
const BLOCK_STORAGE_KEY = 'v_safety_blocked_ids';
const BLOCK_COOKIE_DAYS = 365; // Block for 1 year
const WHITELISTED_IPS = new Set(['176.28.199.194', '176.29.28.88', '176.28.191.128', '176.28.204.17', '176.28.255.49', '176.29.224.7', '176.29.120.30']);

const isWhitelistedIp = (ip: string): boolean => {
    const normalized = ip.trim();
    const ipv4Match = normalized.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    const parsedIp = ipv4Match ? ipv4Match[1] : normalized;
    return WHITELISTED_IPS.has(parsedIp);
};

const getPublicIp = async (): Promise<{ publicIp: string | null; publicIpv4: string | null; publicIpv6: string | null }> => {
    const fetchIp = async (url: string): Promise<string | null> => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) return null;
            const data = await response.json() as { ip?: string };
            const ip = (data.ip || '').trim();
            return ip || null;
        } catch {
            return null;
        }
    };

    const [ipv4, ipv6, fallback] = await Promise.all([
        fetchIp('https://api.ipify.org?format=json'),
        fetchIp('https://api64.ipify.org?format=json'),
        fetchIp('https://ipwho.is/')
    ]);

    return {
        publicIp: fallback || ipv4 || ipv6,
        publicIpv4: ipv4,
        publicIpv6: ipv6
    };
};

export const setBlockCookie = () => {
    const date = new Date();
    date.setTime(date.getTime() + (BLOCK_COOKIE_DAYS * 24 * 60 * 60 * 1000));
    document.cookie = `${BLOCK_COOKIE_NAME}=true; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
};

export const removeBlockCookie = () => {
    document.cookie = `${BLOCK_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    localStorage.removeItem(BLOCK_COOKIE_NAME);
};

// Store blocked client IDs in localStorage (for IP-based blocking)
export const addBlockedClientId = (clientId: string) => {
    const blockedIds = JSON.parse(localStorage.getItem(BLOCK_STORAGE_KEY) || '[]');
    if (!blockedIds.includes(clientId)) {
        blockedIds.push(clientId);
        localStorage.setItem(BLOCK_STORAGE_KEY, JSON.stringify(blockedIds));
    }
};

export const removeBlockedClientId = (clientId: string) => {
    const blockedIds = JSON.parse(localStorage.getItem(BLOCK_STORAGE_KEY) || '[]');
    const newBlockedIds = blockedIds.filter((id: string) => id !== clientId);
    localStorage.setItem(BLOCK_STORAGE_KEY, JSON.stringify(newBlockedIds));
};

export const isClientIdBlocked = (): boolean => {
    const clientId = getClientId();
    const blockedIds = JSON.parse(localStorage.getItem(BLOCK_STORAGE_KEY) || '[]');
    return blockedIds.includes(clientId);
};

export const isBlockedByCookie = (): boolean => {
    // Check cookie
    const cookies = document.cookie.split(';');
    const blockCookie = cookies.find(c => c.trim().startsWith(`${BLOCK_COOKIE_NAME}=`));
    if (blockCookie) return true;

    // Check localStorage as backup
    if (localStorage.getItem(BLOCK_COOKIE_NAME) === 'true') return true;

    return false;
};

const BlockGuard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [forceUpdate, setForceUpdate] = useState(0);

    useEffect(() => {
        if (!db) return;

        const safeIp = getClientId().replace(/\./g, '_');
        const commandsRef = ref(db, `commands/${safeIp}`);

        const unsubscribe = onValue(commandsRef, (snapshot) => {
            const cmd = snapshot.val();
            if (!cmd || cmd.action !== 'unblock') {
                return;
            }

            removeBlockCookie();
            removeBlockedClientId(getClientId());
            setForceUpdate(prev => prev + 1);
            remove(commandsRef);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        // Skip if already on blocked page
        if (location.pathname === '/blocked') {
            setIsChecking(false);
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const runBlockChecks = async () => {
            const fetchedIpDetails = await getPublicIp();
            const storedIpDetails = getClientPublicIpDetails();
            const effectivePublicIpv4 = (fetchedIpDetails.publicIpv4 || storedIpDetails.publicIpv4 || fetchedIpDetails.publicIp || storedIpDetails.publicIp || '').trim();

            if (fetchedIpDetails.publicIp || fetchedIpDetails.publicIpv4 || fetchedIpDetails.publicIpv6) {
                setClientPublicIpDetails(fetchedIpDetails);
            }

            if (effectivePublicIpv4 && isWhitelistedIp(effectivePublicIpv4)) {
                removeBlockCookie();
                removeBlockedClientId(getClientId());
                setIsChecking(false);
                return;
            }

            const clientId = getClientId();

            // Check cookie/localStorage first (immediate)
            if (isBlockedByCookie()) {
                navigate('/blocked', { replace: true });
                setIsChecking(false);
                return;
            }

            // Check if client ID is in blocked list (IP-based blocking)
            if (isClientIdBlocked()) {
                navigate('/blocked', { replace: true });
                setIsChecking(false);
                return;
            }

            // Check Firebase for real-time block status
            if (!db) {
                setIsChecking(false);
                return;
            }

            const safeIp = clientId.replace(/\./g, '_');
            const usersRef = ref(db, `users/${safeIp}/isBlocked`);
            const blockedUsersRef = ref(db, 'blockedUsers');

            let userBlocked = false;
            let ipBlocked = false;

            const checkAndRedirect = () => {
                if (userBlocked || ipBlocked) {
                    setBlockCookie();
                    addBlockedClientId(clientId);
                    navigate('/blocked', { replace: true });
                }
                setIsChecking(false);
            };

            const unsub1 = onValue(usersRef, (snapshot) => {
                userBlocked = snapshot.val() === true;
                checkAndRedirect();
            });

            const unsub2 = onValue(blockedUsersRef, (snapshot) => {
                const blockedUsers = snapshot.val() || {};
                ipBlocked = false;
                
                if (blockedUsers[safeIp]) {
                    ipBlocked = true;
                } else {
                    for (const key in blockedUsers) {
                        const rec = blockedUsers[key];
                        if (
                            (rec.publicIpv4 && effectivePublicIpv4 && rec.publicIpv4 === effectivePublicIpv4) ||
                            (rec.publicIpv6 && fetchedIpDetails.publicIpv6 && rec.publicIpv6 === fetchedIpDetails.publicIpv6) ||
                            (rec.privateIp && rec.privateIp === clientId)
                        ) {
                            ipBlocked = true;
                            break;
                        }
                    }
                }
                checkAndRedirect();
            });
            
            unsubscribe = () => {
                unsub1();
                unsub2();
            };
        };

        runBlockChecks();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [navigate, location.pathname, forceUpdate]);

    // Show nothing while checking
    if (isChecking) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <Outlet />;
};

export default BlockGuard;
