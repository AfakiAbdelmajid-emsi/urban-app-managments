/**
 * Reverse geocoding: Convert coordinates to road name/address
 * Uses Mapbox Geocoding API
 */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export interface GeocodeResult {
  roadName: string;
  fullAddress: string;
}

/**
 * Get road name from coordinates using Mapbox reverse geocoding
 */
export async function getRoadName(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  if (!MAPBOX_TOKEN) {
    return {
      roadName: 'Location unavailable',
      fullAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      
      // Try to get road name from context
      const context = feature.context || [];
      const roadFeature = context.find((ctx: any) => 
        ctx.id?.startsWith('street') || ctx.id?.startsWith('road')
      );
      
      // Get address components
      const address = feature.properties?.address || '';
      const text = feature.text || '';
      const placeName = feature.place_name || '';
      
      // Extract road name
      let roadName = roadFeature?.text || text || address || 'Unknown Road';
      
      // If we have a full address, try to extract just the street name
      if (placeName) {
        const parts = placeName.split(',');
        if (parts.length > 0) {
          roadName = parts[0].trim();
        }
      }

      return {
        roadName: roadName || 'Unknown Road',
        fullAddress: placeName || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      };
    }

    // Fallback if no results
    return {
      roadName: 'Unknown Road',
      fullAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return {
      roadName: 'Location unavailable',
      fullAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  }
}

/**
 * Cache for geocoding results to avoid repeated API calls
 */
const geocodeCache = new Map<string, GeocodeResult>();

export async function getCachedRoadName(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  const key = `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key)!;
  }

  const result = await getRoadName(latitude, longitude);
  geocodeCache.set(key, result);
  
  return result;
}

