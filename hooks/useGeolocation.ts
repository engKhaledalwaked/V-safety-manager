import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationData } from '../types';
import { reverseGeocode, createGoogleMapsUrl } from '../services/geocoding';

interface GeolocationState {
    location: LocationData | null;
    loading: boolean;
    error: string | null;
    permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface UseGeolocationOptions {
    enableHighAccuracy?: boolean;  // استخدام GPS عالي الدقة
    timeout?: number;              // مهلة الانتظار بالميلي ثانية
    maximumAge?: number;           // أقصى عمر للموقع المخزن
    requestOnMount?: boolean;      // طلب الموقع عند تحميل المكون
}

/**
 * Hook مخصص لطلب وإدارة الموقع الجغرافي
 * يطلب الموقع تلقائياً من GPS الجهاز
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
    const {
        enableHighAccuracy = true,
        timeout = 30000,
        maximumAge = 0,
        requestOnMount = true,
    } = options;

    const [state, setState] = useState<GeolocationState>({
        location: null,
        loading: false,
        error: null,
        permissionStatus: 'unknown',
    });

    // مرجع لتتبع ما إذا تم طلب الموقع بالفعل
    const hasRequested = useRef(false);

    /**
     * دالة لإعادة تعيين حالة الطلب
     * تسمح بطلب الموقع مرة أخرى بعد إغلاق Modal
     */
    const resetRequest = useCallback(() => {
        hasRequested.current = false;
        setState(prev => ({
            ...prev,
            loading: false,
            error: null,
        }));
    }, []);

    /**
     * طلب الموقع الجغرافي
     */
    const requestLocation = useCallback(async () => {
        // منع الطلبات المتكررة
        if (hasRequested.current) {
            return null;
        }
        hasRequested.current = true;

        // التحقق من دعم Geolocation API
        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                error: 'المتصفح لا يدعم خدمة تحديد الموقع',
                loading: false,
            }));
            return null;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        return new Promise<LocationData | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude, accuracy } = position.coords;

                        // إنشاء رابط Google Maps
                        const googleMapsUrl = createGoogleMapsUrl(latitude, longitude);

                        // الحصول على العنوان من Reverse Geocoding
                        let address = null;
                        try {
                            address = await reverseGeocode(latitude, longitude);
                        } catch (geoError) {
                            console.warn('Reverse geocoding failed:', geoError);
                        }

                        const locationData: LocationData = {
                            latitude,
                            longitude,
                            accuracy,
                            googleMapsUrl,
                            address: address || undefined,
                            timestamp: Date.now(),
                            permissionStatus: 'granted',
                        };

                        setState({
                            location: locationData,
                            loading: false,
                            error: null,
                            permissionStatus: 'granted',
                        });

                        resolve(locationData);
                    } catch (error) {
                        console.error('Error processing location:', error);
                        setState(prev => ({
                            ...prev,
                            loading: false,
                            error: 'حدث خطأ في معالجة الموقع',
                        }));
                        resolve(null);
                    }
                },
                (error) => {
                    let errorMessage = 'حدث خطأ في تحديد الموقع';
                    let permissionStatus: 'granted' | 'denied' | 'prompt' = 'prompt';

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'تم رفض إذن الوصول للموقع';
                            permissionStatus = 'denied';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'الموقع غير متاح حالياً';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'انتهت مهلة طلب الموقع';
                            break;
                    }

                    setState(prev => ({
                        ...prev,
                        loading: false,
                        error: errorMessage,
                        permissionStatus,
                    }));

                    resolve(null);
                },
                {
                    enableHighAccuracy,
                    timeout,
                    maximumAge,
                }
            );
        });
    }, [enableHighAccuracy, timeout, maximumAge]);

    /**
     * التحقق من حالة الإذن
     */
    const checkPermission = useCallback(async () => {
        if ('permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                return result.state as 'granted' | 'denied' | 'prompt';
            } catch {
                return 'unknown';
            }
        }
        return 'unknown';
    }, []);

    // طلب الموقع عند تحميل المكون إذا كان requestOnMount = true
    useEffect(() => {
        if (requestOnMount && !hasRequested.current) {
            checkPermission().then((status) => {
                if (status !== 'denied') {
                    requestLocation();
                } else {
                    setState(prev => ({
                        ...prev,
                        permissionStatus: 'denied',
                        error: 'تم رفض إذن الوصول للموقع',
                    }));
                }
            });
        }
    }, [requestOnMount, requestLocation, checkPermission]);

    return {
        ...state,
        requestLocation,
        checkPermission,
        resetRequest,
    };
}

export default useGeolocation;
