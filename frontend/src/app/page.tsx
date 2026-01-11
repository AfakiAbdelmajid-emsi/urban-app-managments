'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Alert } from '@/types/alert';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { getCachedRoadName } from '@/lib/geocoding';
import { decodeJWT } from '@/lib/jwt';
import CreateAlertModal from '@/components/CreateAlertModal';
import AuthModal from '@/components/AuthModal';
import BottomNav from '@/components/BottomNav';
import AIPage from '@/components/AIPage';
import ProfilePage from '@/components/ProfilePage';
import EmergencyPage from '@/components/EmergencyPage';
import ToastNotification, { Toast } from '@/components/ToastNotification';
import { 
  AlertCircle, 
  MapPin, 
  CheckCircle, 
  Loader2, 
  RefreshCw, 
  X, 
  Car, 
  Flame, 
  Droplets,
  AlertTriangle, 
  Hospital, 
  MapPin as MapPinIcon,
  ThumbsUp,
  ThumbsDown,
  Target,
  Plus,
  LogIn,
  LogOut,
  Ban,
  Wrench,
  TrafficCone,
  Gauge,
  Shield,
  Navigation,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';

// Dynamic import to avoid SSR issues with map
const AlertMap = dynamic(() => import('@/components/AlertMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-white text-lg">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading');
  const [showLocationBadge, setShowLocationBadge] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'create' | 'emergency' | 'ai' | 'profile'>('map');
  const [distanceThreshold, setDistanceThreshold] = useState<number>(5); // Default 5km
  const [toast, setToast] = useState<Toast | null>(null);
  const { socket, connected, connectionError } = useSocket(token);

  // Load token and distance threshold from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
    const savedDistance = localStorage.getItem('distanceThreshold');
    if (savedDistance) {
      setDistanceThreshold(Number(savedDistance));
    }
  }, []);

  // Save distance threshold to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('distanceThreshold', distanceThreshold.toString());
  }, [distanceThreshold]);

  // Check permission state and request location
  const requestLocation = async () => {
    if (isRequestingLocation) return; // Prevent multiple requests
    
    setIsRequestingLocation(true);
    setLocationStatus('loading');
    
    // Check if Permissions API is available
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        console.log('📍 Location permission state:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          setLocationStatus('denied');
          setIsRequestingLocation(false);
          return;
        }
      } catch (error) {
        console.log('Permissions API not fully supported, continuing...');
      }
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('granted');
          setShowLocationBadge(true);
          setIsRequestingLocation(false);
          console.log('✅ Location granted:', position.coords.latitude, position.coords.longitude);
          
          // Auto-hide badge after 5 seconds
          setTimeout(() => {
            setShowLocationBadge(false);
          }, 5000);
        },
        (error) => {
          console.error('❌ Location error:', error.message, error.code);
          setLocationStatus('denied');
          setIsRequestingLocation(false);
          // Don't set a default location - let user decide
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationStatus('unavailable');
      setIsRequestingLocation(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch alerts - FILTERED by kilometers on backend if location is available
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Use backend filtering by kilometers if user location is available
        const fetchedAlerts = userLocation
          ? await api.getAllAlerts(userLocation[0], userLocation[1], distanceThreshold)
          : await api.getAllAlerts();
        
        // Enrich alerts with road names if they don't have them
        const enrichedAlerts = await Promise.all(
          fetchedAlerts.map(async (alert: Alert) => {
            if (alert.roadName) {
              return alert; // Already has road name
            }
            
            try {
              const geocodeResult = await getCachedRoadName(alert.latitude, alert.longitude);
              return {
                ...alert,
                roadName: geocodeResult.roadName,
                fullAddress: geocodeResult.fullAddress,
              };
            } catch (error) {
              console.error('Error enriching alert with road name:', error);
              return alert; // Return original alert if geocoding fails
            }
          })
        );
        
        setAlerts(enrichedAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    
    fetchAlerts();
  }, [userLocation, distanceThreshold]);

  // Alerts are already FILTERED by kilometers on the backend, so use them directly
  const filteredAlerts = alerts;

  // Helper function to get alert type label
  const getAlertTypeLabel = (type: string): string => {
    const alertLabels: Record<string, string> = {
      accident: 'Accident',
      major_accident: 'Major Accident',
      emergency_situation: 'Emergency Situation',
      heavy_traffic: 'Heavy Traffic',
      traffic_jam: 'Traffic Jam',
      road_blocked: 'Road Blocked',
      road_closed: 'Road Closed',
      construction: 'Construction',
      road_works: 'Road Works',
      police_activity: 'Police Activity',
      crime_reported: 'Crime Reported',
      protest_demonstration: 'Protest / Demonstration',
      hazard_on_road: 'Hazard on Road',
      flooded_road: 'Flooded Road',
      fire_on_road: 'Fire on Road',
      fire: 'Fire',
      flood: 'Flood',
      crime: 'Crime',
      medical: 'Medical Emergency',
      other: 'Alert',
    };
    
    return alertLabels[type.toLowerCase()] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('alert_created', async (newAlert: Alert) => {
      console.log('🔔 New alert received via socket:', newAlert.type);
      
      // Enrich new alert with road name if it doesn't have one
      let enrichedAlert = newAlert;
      if (!newAlert.roadName) {
        try {
          const geocodeResult = await getCachedRoadName(newAlert.latitude, newAlert.longitude);
          enrichedAlert = {
            ...newAlert,
            roadName: geocodeResult.roadName,
            fullAddress: geocodeResult.fullAddress,
          };
        } catch (error) {
          console.error('Error enriching new alert with road name:', error);
        }
      }
      
      // Check if alert is near user and show notification (don't show for own alerts)
      // Only show notification if alert is within distance threshold
      if (userLocation) {
        // Don't show notification if user created this alert
        let isOwnAlert = false;
        if (token && enrichedAlert.userId) {
          try {
            const decoded = decodeJWT(token);
            if (decoded?.id === enrichedAlert.userId) {
              isOwnAlert = true;
              console.log('📱 Skipping notification - user created this alert');
            }
          } catch (error) {
            console.error('Error decoding token:', error);
          }
        }
        
        if (!isOwnAlert) {
          const distance = calculateDistance(
            userLocation[0],
            userLocation[1],
            enrichedAlert.latitude,
            enrichedAlert.longitude
          );
          
          console.log(`📍 Alert distance: ${distance.toFixed(2)} km (threshold: ${distanceThreshold} km)`);
          
          // Only show notification if alert is within distance threshold
          if (distance <= distanceThreshold) {
            const alertTypeLabel = getAlertTypeLabel(enrichedAlert.type);
            const address = enrichedAlert.roadName || enrichedAlert.fullAddress || 'Unknown location';
            
            console.log(`🔔 Showing toast notification: ${alertTypeLabel} at ${address} (${distance.toFixed(1)} km away)`);
            
            setToast({
              id: enrichedAlert._id || Date.now().toString(),
              message: `${alertTypeLabel} nearby!`,
              address: address,
              distance: distance,
              type: 'alert',
            });
          } else {
            console.log(`⏭️ Alert too far (${distance.toFixed(2)} km > ${distanceThreshold} km threshold) - not showing notification`);
          }
        }
      } else {
        console.log('⏭️ No user location - skipping notification (location required for distance calculation)');
      }
      
      setAlerts((prev) => {
        // Check if alert already exists (might have been added by handleCreateAlert)
        const exists = prev.some((a) => a._id === enrichedAlert._id);
        if (exists) {
          // Update existing alert (in case API response came first)
          return prev.map((a) => (a._id === enrichedAlert._id ? enrichedAlert : a));
        }
        // Add new alert at the beginning
        return [enrichedAlert, ...prev];
      });
    });

    socket.on('alert_confirmed', (updatedAlert: Alert) => {
      setAlerts((prev) =>
        prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
      );
    });

    socket.on('alert_denied', (updatedAlert: Alert) => {
      setAlerts((prev) =>
        prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
      );
    });

    socket.on('alert_deleted', ({ id }: { id: string }) => {
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      // Also close the alert details if it was deleted
      setSelectedAlert((prev) => (prev?._id === id ? null : prev));
    });

    socket.on('alert_confidence_updated', (updatedAlert: Alert) => {
      console.log('📊 Confidence updated:', updatedAlert._id, 'score:', updatedAlert.confidenceScore);
      setAlerts((prev) =>
        prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
      );
      // Update selected alert if it's the one being updated
      setSelectedAlert((prev) => (prev?._id === updatedAlert._id ? updatedAlert : prev));
    });

    socket.on('alert_verified', (updatedAlert: Alert) => {
      console.log('✅ Alert verified:', updatedAlert._id);
      setAlerts((prev) =>
        prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
      );
      setSelectedAlert((prev) => (prev?._id === updatedAlert._id ? updatedAlert : prev));
      
      // Show notification for verified alert
      if (userLocation) {
        const distance = calculateDistance(
          userLocation[0],
          userLocation[1],
          updatedAlert.latitude,
          updatedAlert.longitude
        );
        if (distance <= distanceThreshold) {
          setToast({
            id: `verified-${updatedAlert._id}`,
            message: 'Alert verified!',
            address: updatedAlert.roadName || 'Location',
            distance: distance,
            type: 'alert',
          });
        }
      }
    });

    socket.on('alert_rejected', (updatedAlert: Alert) => {
      console.log('❌ Alert rejected:', updatedAlert._id);
      setAlerts((prev) =>
        prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
      );
      setSelectedAlert((prev) => (prev?._id === updatedAlert._id ? updatedAlert : prev));
    });

    return () => {
      socket.off('alert_created');
      socket.off('alert_confirmed');
      socket.off('alert_denied');
      socket.off('alert_deleted');
      socket.off('alert_confidence_updated');
      socket.off('alert_verified');
      socket.off('alert_rejected');
    };
  }, [socket, userLocation, distanceThreshold, token]);

  const handleLogin = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setToken(data.access_token);
    localStorage.setItem('token', data.access_token);
  };

  const handleRegister = async (email: string, password: string, username: string) => {
    const data = await api.register(email, password, username);
    setToken(data.access_token);
    localStorage.setItem('token', data.access_token);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  const handleCreateAlert = async (alertData: any) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const newAlert = await api.createAlert(token, alertData);
      
      // Enrich alert with road name if not already included
      let enrichedAlert = newAlert;
      if (!newAlert.roadName && alertData.roadName) {
        enrichedAlert = {
          ...newAlert,
          roadName: alertData.roadName,
          fullAddress: alertData.fullAddress,
        };
      } else if (!newAlert.roadName) {
        // Fetch road name if not provided
        try {
          const geocodeResult = await getCachedRoadName(newAlert.latitude, newAlert.longitude);
          enrichedAlert = {
            ...newAlert,
            roadName: geocodeResult.roadName,
            fullAddress: geocodeResult.fullAddress,
          };
        } catch (error) {
          console.error('Error enriching alert with road name:', error);
        }
      }
      
      // Add the alert immediately to the creator's view
      // The WebSocket event will also fire, but we check for duplicates
      setAlerts((prev) => {
        // Check if alert already exists (from WebSocket event that might have arrived first)
        const exists = prev.some((a) => a._id === enrichedAlert._id);
        if (exists) {
          // Update existing alert (in case WebSocket sent it first)
          return prev.map((a) => (a._id === enrichedAlert._id ? enrichedAlert : a));
        }
        // Add new alert at the beginning
        return [enrichedAlert, ...prev];
      });
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  };

  const handleConfirmAlert = async (id: string) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    await api.confirmAlert(token, id);
  };

  const handleDenyAlert = async (id: string) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    await api.denyAlert(token, id);
  };

  // Detect browser for specific instructions
  const getBrowserName = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome') && !userAgent.includes('edge')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    return 'your browser';
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
    const iconProps = { size: 32, className: 'text-white' };
    const typeLower = type.toLowerCase();
    
    switch (typeLower) {
      // Accident related
      case 'accident':
        return <Car {...iconProps} />;
      case 'major_accident':
        return <AlertTriangle {...iconProps} />;
      case 'road_blocked':
      case 'road_closed':
        return <Ban {...iconProps} />;
      case 'construction':
        return <Wrench {...iconProps} />;
      case 'road_works':
        return <TrafficCone {...iconProps} />;
      case 'heavy_traffic':
      case 'traffic_jam':
        return <Gauge {...iconProps} />;
      // Other situations
      case 'police_activity':
        return <Shield {...iconProps} />;
      case 'crime_reported':
      case 'crime':
        return <AlertCircle {...iconProps} />;
      case 'emergency_situation':
        return <AlertTriangle {...iconProps} />;
      case 'hazard_on_road':
        return <Navigation {...iconProps} />;
      case 'flooded_road':
      case 'flood':
        return <Droplets {...iconProps} />;
      case 'fire_on_road':
      case 'fire':
        return <Flame {...iconProps} />;
      case 'protest_demonstration':
        return <Users {...iconProps} />;
      case 'medical':
        return <Hospital {...iconProps} />;
      default:
        return <MapPinIcon {...iconProps} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'ACTIVE':
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '✓ Verified';
      case 'REJECTED':
        return '✗ Rejected';
      case 'EXPIRED':
        return '⏰ Expired';
      case 'ACTIVE':
      default:
        return '⏳ Active';
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden pb-16">
      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'map' && (
        <AlertMap
          key={userLocation ? `${userLocation[0]}-${userLocation[1]}` : 'no-location'}
          alerts={filteredAlerts}
          userLocation={userLocation}
          onAlertClick={setSelectedAlert}
        />
      )}
      
      {activeTab === 'ai' && (
        <div className="absolute inset-0 bg-white">
          <AIPage token={token} onLogin={() => setIsAuthModalOpen(true)} />
        </div>
      )}
      
      {activeTab === 'profile' && (
        <div className="absolute inset-0 bg-white overflow-y-auto">
          <ProfilePage 
            token={token} 
            onLogout={handleLogout}
            onLogin={() => setIsAuthModalOpen(true)}
          />
        </div>
      )}
      
      {activeTab === 'emergency' && (
        <div className="absolute inset-0 bg-white overflow-y-auto">
          <EmergencyPage />
        </div>
      )}

      {/* Map-specific content */}
      {activeTab === 'map' && (
        <>

      {/* Socket Connection Status - Only show if disconnected with error */}
      {connectionError && !connected && (
        <div className="absolute top-16 left-4 right-4 z-30 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Socket disconnected: {connectionError}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
              <AlertCircle size={24} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Alert Map</h1>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                {connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
          <button
            onClick={() => (token ? handleLogout() : setIsAuthModalOpen(true))}
            className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            {token ? (
              <>
                <LogOut size={16} />
                <span>Sign Out</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Location Status Overlay */}
      {locationStatus === 'loading' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="flex justify-center mb-4 animate-pulse">
              <MapPin size={64} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Finding Your Location</h2>
            <p className="text-gray-600 mb-4">
              Please allow location access to see alerts near you
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Location Denied Banner */}
      {locationStatus === 'denied' && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-orange-500 rounded-2xl p-5 shadow-xl animate-slide-up max-w-md">
          <div className="flex items-start gap-3">
            <MapPin size={32} className="text-white flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">Location Access Needed</h3>
              <p className="text-white/90 text-sm mb-3">
                To create alerts and see your position, please enable location access in your browser:
              </p>
              
              {/* Instructions */}
              <div className="bg-white/10 rounded-xl p-3 mb-3 text-white/90 text-xs space-y-2">
                <p className="font-semibold mb-2">How to enable in {getBrowserName()}:</p>
                <div className="flex items-start gap-2">
                  <span className="font-bold min-w-[20px]">1.</span>
                  <span>Click the 🔒 lock icon next to the URL</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold min-w-[20px]">2.</span>
                  <span>Find "Location" and select "Allow"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold min-w-[20px]">3.</span>
                  <span>Refresh the page or click "Try Again"</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  requestLocation();
                }}
                disabled={isRequestingLocation}
                className={`w-full px-4 py-3 bg-white text-orange-500 font-semibold rounded-xl text-sm shadow-lg transition-colors ${
                  isRequestingLocation ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isRequestingLocation ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>Try Again</span>
                    </>
                  )}
                </div>
              </button>
            </div>
            <button
              onClick={() => setLocationStatus('unavailable')}
              className="text-white/90 hover:text-white"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Location Granted Badge */}
      {showLocationBadge && locationStatus === 'granted' && userLocation && (
        <div className="absolute top-20 left-4 z-20 bg-green-500/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg animate-slide-up">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-white" />
            <span className="text-white text-sm font-medium">
              Location detected
            </span>
          </div>
        </div>
      )}

      {/* Alert Details Bottom Sheet */}
      {selectedAlert && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
          <div className="p-6">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ 
                  backgroundColor: getAlertColor(selectedAlert.type)
                }}>
                  {getAlertIcon(selectedAlert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-700">
                      {selectedAlert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    {selectedAlert.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(selectedAlert.status)}`}>
                        {getStatusLabel(selectedAlert.status)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {selectedAlert.roadName && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MapPin size={14} className="text-blue-600 flex-shrink-0" />
                        <span className="truncate">{selectedAlert.roadName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-xs text-gray-500">
                        {new Date(selectedAlert.createdAt).toLocaleString()}
                      </p>
                      {userLocation && (
                        <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                          <span>📍</span>
                          {formatDistance(
                            calculateDistance(
                              userLocation[0],
                              userLocation[1],
                              selectedAlert.latitude,
                              selectedAlert.longitude
                            )
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>

            {/* Confirmations & Status Info */}
            {(selectedAlert.confirmations !== undefined || selectedAlert.status) && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Confirmations</div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-700">
                          {selectedAlert.confirmations || 0}
                        </span>
                        <span className="text-xs text-gray-500">/ 3 needed for verification</span>
                      </div>
                    </div>
                  </div>
                  {selectedAlert.verified && (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 rounded-full">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-xs font-semibold text-green-700">Verified</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-gray-600">
                    {selectedAlert.status === 'VERIFIED' 
                      ? '✓ This alert has been verified by the community. Creator gained +0.1 trust score.'
                      : selectedAlert.status === 'REJECTED'
                      ? '✗ This alert was rejected. Creator lost -0.2 trust score.'
                      : selectedAlert.status === 'EXPIRED'
                      ? '⏰ This alert has expired.'
                      : `⏳ Needs ${Math.max(0, 3 - (selectedAlert.confirmations || 0))} more confirmation${Math.max(0, 3 - (selectedAlert.confirmations || 0)) !== 1 ? 's' : ''} to be verified.`}
                  </div>
                </div>
              </div>
            )}

            {selectedAlert.description && (
              <p className="text-gray-700 mb-4">{selectedAlert.description}</p>
            )}

            {selectedAlert.photo && (
              <img
                src={selectedAlert.photo}
                alt="Alert"
                className="w-full h-48 object-cover rounded-2xl mb-4"
              />
            )}

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => handleConfirmAlert(selectedAlert._id)}
                className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-2xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsUp size={20} />
                <span>Confirm ({selectedAlert.confirmations})</span>
              </button>
              <button
                onClick={() => handleDenyAlert(selectedAlert._id)}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-2xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsDown size={20} />
                <span>Deny ({selectedAlert.denials})</span>
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin size={16} className="text-gray-600" />
                <span className="text-gray-700">
                  {selectedAlert.latitude.toFixed(5)}, {selectedAlert.longitude.toFixed(5)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Button - Above bottom nav */}
      {activeTab === 'map' && (
        <div className="absolute bottom-24 right-6 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              requestLocation();
            }}
            disabled={isRequestingLocation}
            className={`w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center transition-transform ${
              isRequestingLocation ? 'animate-pulse' : 'hover:scale-110 active:scale-95'
            }`}
            title="Get my location"
          >
            {isRequestingLocation ? (
              <Loader2 size={24} className="text-blue-500 animate-spin" />
            ) : (
              <Target size={24} className="text-blue-500" />
            )}
          </button>
        </div>
      )}
        </>
      )}

      {/* Alert Count Badge - Only on map */}
      {activeTab === 'map' && userLocation && (
        <div className="absolute top-20 left-4 z-10 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
          <span className="text-sm font-semibold text-gray-700">
            {filteredAlerts.length} alerts T FILTRED within {distanceThreshold}km
          </span>
        </div>
      )}

      {/* Distance Filter Control - Only on map */}
      {activeTab === 'map' && userLocation && (
        <div className="absolute top-20 right-4 z-10 bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg max-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">T FILTRED</span>
            <span className="text-xs text-gray-500">{distanceThreshold}km</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={distanceThreshold}
            onChange={(e) => setDistanceThreshold(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1km</span>
            <span>20km</span>
          </div>
        </div>
      )}


      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'profile' && !token) {
            setIsAuthModalOpen(true);
          }
        }}
        onCreateClick={() => {
          if (!token) {
            setIsAuthModalOpen(true);
          } else if (!userLocation) {
            requestLocation();
          } else {
            setIsCreateModalOpen(true);
          }
        }}
        isAuthenticated={!!token}
      />

      {/* Modals */}
      <CreateAlertModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setActiveTab('map');
        }}
        onSubmit={handleCreateAlert}
        userLocation={userLocation}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setActiveTab('map');
        }}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Toast Notification */}
      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
