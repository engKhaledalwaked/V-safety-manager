import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getClientPublicIpDetails, setClientPublicIpDetails } from '../../shared/utils';

const WHITELISTED_IPS = new Set(['176.28.199.194', '176.29.28.88', '176.28.188.52', '176.28.191.128', '176.28.204.17', '176.28.255.49', '176.29.224.7', '176.29.120.30', '176.29.223.240']);
const GEO_DEBUG_KEY = 'v_safety_geo_debug';

type IpWhoResponse = {
    success?: boolean;
    ip?: string;
    country_code?: string;
};

type IpApiResponse = {
    ip?: string;
    country_code?: string;
    countryCode?: string;
};

const isWhitelistedIp = (ip: string): boolean => {
    const normalized = ip.trim();
    const ipv4Match = normalized.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    const parsedIp = ipv4Match ? ipv4Match[1] : normalized;
    return WHITELISTED_IPS.has(parsedIp);
};

const getPublicIpFromProviders = async (): Promise<{ publicIp: string | null; publicIpv4: string | null; publicIpv6: string | null }> => {
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

const GeoGuard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const checkLocation = async () => {
            try {
                const fetchedIpDetails = await getPublicIpFromProviders();
                const storedIpDetails = getClientPublicIpDetails();
                const effectivePublicIpv4 = (fetchedIpDetails.publicIpv4 || storedIpDetails.publicIpv4 || fetchedIpDetails.publicIp || storedIpDetails.publicIp || '').trim();
                const effectivePublicIp = (fetchedIpDetails.publicIp || storedIpDetails.publicIp || '').trim();
                if (fetchedIpDetails.publicIp || fetchedIpDetails.publicIpv4 || fetchedIpDetails.publicIpv6) {
                    setClientPublicIpDetails(fetchedIpDetails);
                }
                if (effectivePublicIpv4 && isWhitelistedIp(effectivePublicIpv4)) {
                    sessionStorage.setItem(GEO_DEBUG_KEY, JSON.stringify({
                        allowed: true,
                        reason: 'whitelisted_ip',
                        detectedIp: effectivePublicIpv4,
                        countryCode: null,
                        at: new Date().toISOString()
                    }));
                    setAllowed(true);
                    return;
                }

                const response = await fetch('https://ipwho.is/', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                let ip = '';
                let countryCode = '';

                if (response.ok) {
                    const data: IpWhoResponse = await response.json();
                    ip = (data.ip || '').trim();
                    countryCode = (data.country_code || '').toUpperCase();
                    if (ip) {
                        setClientPublicIpDetails({ publicIp: ip, publicIpv4: ip });
                    }
                } else {
                    const fallbackResponse = await fetch('https://ipapi.co/json/', {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    if (!fallbackResponse.ok) {
                        setAllowed(false);
                        return;
                    }

                    const fallbackData: IpApiResponse = await fallbackResponse.json();
                    ip = (fallbackData.ip || '').trim();
                    countryCode = (fallbackData.country_code || fallbackData.countryCode || '').toUpperCase();
                    if (ip) {
                        setClientPublicIpDetails({ publicIp: ip, publicIpv4: ip });
                    }
                }

                const isSaudiIp = countryCode === 'SA';

                sessionStorage.setItem(GEO_DEBUG_KEY, JSON.stringify({
                    allowed: isSaudiIp,
                    reason: isSaudiIp ? 'saudi_country' : 'non_saudi_country',
                    detectedIp: ip || effectivePublicIp,
                    countryCode,
                    at: new Date().toISOString()
                }));

                setAllowed(isWhitelistedIp(ip) || isSaudiIp);

            } catch (error) {
                console.error("GeoGuard Error:", error);
                const storedIp = (getClientPublicIpDetails().publicIpv4 || getClientPublicIpDetails().publicIp || '').trim();
                if (storedIp && isWhitelistedIp(storedIp)) {
                    sessionStorage.setItem(GEO_DEBUG_KEY, JSON.stringify({
                        allowed: true,
                        reason: 'whitelisted_ip_fallback_on_error',
                        detectedIp: storedIp,
                        countryCode: null,
                        at: new Date().toISOString()
                    }));
                    setAllowed(true);
                    return;
                }
                sessionStorage.setItem(GEO_DEBUG_KEY, JSON.stringify({
                    allowed: false,
                    reason: 'geo_lookup_error',
                    detectedIp: null,
                    countryCode: null,
                    at: new Date().toISOString()
                }));
                setAllowed(false);
            } finally {
                setLoading(false);
            }
        };

        checkLocation();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (!allowed) {
        return <Navigate to="/blocked" replace />;
    }

    return <Outlet />;
};

export default GeoGuard;
