import { LocationData } from '../types';

/**
 * خدمة تحويل الإحداثيات إلى عنوان (Reverse Geocoding)
 * باستخدام OpenStreetMap Nominatim API (مجاني)
 */

interface NominatimResponse {
    display_name: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        neighbourhood?: string;
        road?: string;
        street?: string;
        state?: string;
        region?: string;
        country?: string;
        country_code?: string;
    };
}

/**
 * تحويل الإحداثيات إلى عنوان مفصل
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData['address'] | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`,
            {
                headers: {
                    'Accept-Language': 'ar',
                },
            }
        );

        if (!response.ok) {
            console.error('Geocoding API error:', response.status);
            return null;
        }

        const data: NominatimResponse = await response.json();

        if (data && data.address) {
            return {
                fullAddress: data.display_name,
                city: data.address.city || data.address.town || data.address.village || '',
                district: data.address.suburb || data.address.neighbourhood || '',
                street: data.address.road || data.address.street || '',
                region: data.address.state || data.address.region || '',
                country: data.address.country || '',
            };
        }

        return null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

/**
 * إنشاء رابط Google Maps من الإحداثيات
 */
export function createGoogleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * إنشاء رابط Google Maps للتضمين
 */
export function createGoogleMapsEmbedUrl(latitude: number, longitude: number): string {
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
}
