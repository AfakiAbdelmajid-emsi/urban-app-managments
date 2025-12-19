'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import { Alert } from '@/types/alert';
import { 
  Car, 
  AlertTriangle, 
  MapPin, 
  ThumbsUp, 
  ThumbsDown,
  Ban,
  Wrench,
  TrafficCone,
  Gauge,
  Shield,
  AlertCircle,
  Navigation,
  Droplets,
  Flame,
  Users
} from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface AlertMapProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  userLocation?: [number, number] | null;
}

export default function AlertMap({ alerts, onAlertClick, userLocation }: AlertMapProps) {
  const [viewState, setViewState] = useState({
    longitude: userLocation?.[1] || -7.5, // Default to Morocco center
    latitude: userLocation?.[0] || 32.0,
    zoom: userLocation ? 14 : 6,
  });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (userLocation) {
      setViewState({
        longitude: userLocation[1],
        latitude: userLocation[0],
        zoom: 15,
      });
      setMapReady(true);
    }
  }, [userLocation]);

  // Calculate bounds around user location (~100km radius)
  // This restricts the map view to only load tiles in this area
  const getBounds = () => {
    if (!userLocation) return undefined;
    
    // ~100km radius in degrees (approximate for Morocco latitude ~32°)
    // 1 degree latitude ≈ 111km, so 0.9 degrees ≈ 100km
    const latRadius = 0.9;
    // Longitude varies by latitude, at 32°N: 1 degree ≈ 94km
    const lngRadius = 0.9;
    
    return [
      [userLocation[1] - lngRadius, userLocation[0] - latRadius], // Southwest
      [userLocation[1] + lngRadius, userLocation[0] + latRadius], // Northeast
    ] as [[number, number], [number, number]];
  };

  const getAlertColor = (type: string) => {
    const colors: Record<string, string> = {
      // Accident related
      accident: '#ef4444',
      major_accident: '#dc2626',
      road_blocked: '#f97316',
      road_closed: '#f97316',
      construction: '#f59e0b',
      road_works: '#f59e0b',
      heavy_traffic: '#eab308',
      traffic_jam: '#eab308',
      // Other situations
      police_activity: '#3b82f6',
      crime_reported: '#a855f7',
      emergency_situation: '#ec4899',
      hazard_on_road: '#f97316',
      flooded_road: '#3b82f6',
      fire_on_road: '#f97316',
      protest_demonstration: '#8b5cf6',
      // Legacy types
      fire: '#f97316',
      flood: '#3b82f6',
      crime: '#a855f7',
      medical: '#ec4899',
      other: '#6b7280',
    };
    return colors[type.toLowerCase()] || '#6b7280';
  };

  const getAlertIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    const iconProps = { size: 20, className: 'text-white' };
    
    const iconMap: Record<string, React.ReactNode> = {
      // Accident related
      accident: <Car {...iconProps} />,
      major_accident: <AlertTriangle {...iconProps} />,
      road_blocked: <Ban {...iconProps} />,
      road_closed: <Ban {...iconProps} />,
      construction: <Wrench {...iconProps} />,
      road_works: <TrafficCone {...iconProps} />,
      heavy_traffic: <Gauge {...iconProps} />,
      traffic_jam: <Gauge {...iconProps} />,
      // Other situations
      police_activity: <Shield {...iconProps} />,
      crime_reported: <AlertCircle {...iconProps} />,
      emergency_situation: <AlertTriangle {...iconProps} />,
      hazard_on_road: <Navigation {...iconProps} />,
      flooded_road: <Droplets {...iconProps} />,
      fire_on_road: <Flame {...iconProps} />,
      protest_demonstration: <Users {...iconProps} />,
      // Legacy types
      fire: <Flame {...iconProps} />,
      flood: <Droplets {...iconProps} />,
      crime: <AlertTriangle {...iconProps} />,
      medical: <AlertCircle {...iconProps} />,
      other: <MapPin {...iconProps} />,
    };
    
    return iconMap[typeLower] || <MapPin {...iconProps} />;
  };

  // Function to offset markers at the same location
  const getOffsetPosition = (alert: Alert, index: number, sameLocationCount: number) => {
    if (sameLocationCount <= 1) {
      return { latitude: alert.latitude, longitude: alert.longitude };
    }

    // Calculate offset in a circular pattern
    // Radius increases with zoom level (smaller at higher zoom)
    const baseRadius = 0.00015; // Base offset in degrees (~15 meters)
    const angle = (2 * Math.PI * index) / sameLocationCount;
    const radius = baseRadius * Math.min(sameLocationCount / 2, 1.5);
    
    // Calculate offset coordinates
    const offsetLat = alert.latitude + radius * Math.cos(angle);
    const offsetLng = alert.longitude + radius * Math.sin(angle);
    
    return { latitude: offsetLat, longitude: offsetLng };
  };

  // Group alerts by location and calculate offsets
  const getAlertsWithOffsets = () => {
    const locationGroups: Record<string, Alert[]> = {};
    const LOCATION_TOLERANCE = 0.0001; // ~10 meters

    // Group alerts by location
    alerts.forEach((alert: Alert) => {
      const locationKey = `${Math.round(alert.latitude / LOCATION_TOLERANCE)}_${Math.round(alert.longitude / LOCATION_TOLERANCE)}`;
      
      if (!locationGroups[locationKey]) {
        locationGroups[locationKey] = [];
      }
      locationGroups[locationKey].push(alert);
    });

    // Calculate offsets for each group
    const alertsWithOffsets: Array<Alert & { offsetLat: number; offsetLng: number }> = [];
    
    Object.values(locationGroups).forEach((group: Alert[]) => {
      group.forEach((alert: Alert, index: number) => {
        const offset = getOffsetPosition(alert, index, group.length);
        alertsWithOffsets.push({
          ...alert,
          offsetLat: offset.latitude,
          offsetLng: offset.longitude,
        });
      });
    });

    return alertsWithOffsets;
  };

  // Don't render map until user location is available
  if (!userLocation) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="text-lg mb-2">Waiting for location...</div>
          <div className="text-sm text-gray-400">Please enable location access</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        minZoom={10}
        maxZoom={18}
        maxBounds={getBounds()}
        onLoad={() => setMapReady(true)}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation[1]}
            latitude={userLocation[0]}
            anchor="center"
          >
            <div className="relative">
              {/* Pulse effect */}
              <div className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-blue-500/30 rounded-full animate-ping" />
              {/* Main dot */}
              <div className="relative w-4 h-4 bg-blue-500 rounded-full border-3 border-white shadow-xl" />
            </div>
          </Marker>
        )}

        {/* Alert Markers */}
        {getAlertsWithOffsets().map((alert) => (
          <Marker
            key={alert._id}
            longitude={alert.offsetLng}
            latitude={alert.offsetLat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedAlert(alert);
              onAlertClick?.(alert);
            }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg cursor-pointer transform transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: getAlertColor(alert.type) }}
            >
              {getAlertIcon(alert.type)}
            </div>
          </Marker>
        ))}

        {/* Popup for selected alert */}
        {selectedAlert && (
          <Popup
            longitude={selectedAlert.longitude}
            latitude={selectedAlert.latitude}
            anchor="top"
            onClose={() => setSelectedAlert(null)}
            closeButton={true}
            closeOnClick={false}
            className="alert-popup"
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div style={{ color: getAlertColor(selectedAlert.type) }}>
                  {getAlertIcon(selectedAlert.type)}
                </div>
                <h3 className="font-bold text-lg text-gray-700">
                  {selectedAlert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
              </div>
              {selectedAlert.description && (
                <p className="text-sm text-gray-700 mb-2">{selectedAlert.description}</p>
              )}
              {selectedAlert.photo && (
                <img
                  src={selectedAlert.photo}
                  alt="Alert"
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <div className="flex gap-3 text-xs text-gray-600 items-center">
                <div className="flex items-center gap-1">
                  <ThumbsUp size={14} />
                  <span>{selectedAlert.confirmations}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown size={14} />
                  <span>{selectedAlert.denials}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(selectedAlert.createdAt).toLocaleString()}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

