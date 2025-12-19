'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { CreateAlertDto } from '@/types/alert';
import { getCachedRoadName } from '@/lib/geocoding';
import { 
  Car, 
  AlertTriangle, 
  MapPin, 
  Camera, 
  Image as ImageIcon, 
  X, 
  MapPin as LocationIcon,
  Ban,
  Wrench,
  TrafficCone,
  Gauge,
  Shield,
  AlertCircle,
  Navigation,
  Droplets,
  Flame,
  Users,
  ChevronDown,
  Loader2
} from 'lucide-react';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (alert: CreateAlertDto) => void;
  userLocation: [number, number] | null;
}

// Alert types organized by category
const ALERT_CATEGORIES = {
  'Accidents & Emergencies': [
    { value: 'accident', label: 'Accident', icon: Car, color: '#ef4444' },
    { value: 'major_accident', label: 'Major accident', icon: AlertTriangle, color: '#dc2626' },
    { value: 'emergency_situation', label: 'Emergency situation', icon: AlertTriangle, color: '#ec4899' },
  ],
  'Traffic & Road Conditions': [
    { value: 'heavy_traffic', label: 'Heavy traffic', icon: Gauge, color: '#eab308' },
    { value: 'traffic_jam', label: 'Traffic jam', icon: Gauge, color: '#eab308' },
    { value: 'road_blocked', label: 'Road blocked', icon: Ban, color: '#f97316' },
    { value: 'road_closed', label: 'Road closed', icon: Ban, color: '#f97316' },
  ],
  'Road Works & Construction': [
    { value: 'construction', label: 'Construction', icon: Wrench, color: '#f59e0b' },
    { value: 'road_works', label: 'Road works', icon: TrafficCone, color: '#f59e0b' },
  ],
  'Safety & Security': [
    { value: 'police_activity', label: 'Police activity', icon: Shield, color: '#3b82f6' },
    { value: 'crime_reported', label: 'Crime reported', icon: AlertCircle, color: '#a855f7' },
    { value: 'protest_demonstration', label: 'Protest / demonstration', icon: Users, color: '#8b5cf6' },
  ],
  'Weather & Hazards': [
    { value: 'hazard_on_road', label: 'Hazard on road', icon: Navigation, color: '#f97316' },
    { value: 'flooded_road', label: 'Flooded road', icon: Droplets, color: '#3b82f6' },
    { value: 'fire_on_road', label: 'Fire on road', icon: Flame, color: '#f97316' },
  ],
};

const ALL_ALERT_TYPES = Object.values(ALERT_CATEGORIES).flat();

export default function CreateAlertModal({
  isOpen,
  onClose,
  onSubmit,
  userLocation,
}: CreateAlertModalProps) {
  const [type, setType] = useState('accident');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(ALERT_CATEGORIES)[0]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [roadName, setRoadName] = useState<string>('');
  const [fullAddress, setFullAddress] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Fetch road name when user location changes
  useEffect(() => {
    if (userLocation) {
      setIsLoadingLocation(true);
      getCachedRoadName(userLocation[0], userLocation[1])
        .then((result) => {
          setRoadName(result.roadName);
          setFullAddress(result.fullAddress);
        })
        .catch((error) => {
          console.error('Error fetching road name:', error);
          setRoadName('Location unavailable');
          setFullAddress(`${userLocation[0].toFixed(5)}, ${userLocation[1].toFixed(5)}`);
        })
        .finally(() => {
          setIsLoadingLocation(false);
        });
    }
  }, [userLocation]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(imageData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const handleSubmit = async () => {
    if (!userLocation) {
      alert('Location is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        description: description || undefined,
        latitude: userLocation[0],
        longitude: userLocation[1],
        roadName: roadName || undefined,
        fullAddress: fullAddress || undefined,
        photo: photo || undefined,
      });
      // Reset form
      setType('accident');
      setDescription('');
      setPhoto(null);
      setSelectedCategory(Object.keys(ALERT_CATEGORIES)[0]);
      setIsCategoryOpen(false);
      stopCamera();
      onClose();
    } catch (err) {
      console.error('Error creating alert:', err);
      alert('Failed to create alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-700">New Alert</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700"
            >
              <X size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alert Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Alert Type *
            </label>
            
            {/* Category Dropdown */}
            <div className="relative mb-3">
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-between hover:border-blue-500 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{selectedCategory}</span>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isCategoryOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsCategoryOpen(false)}
                  />
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {Object.keys(ALERT_CATEGORIES).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryOpen(false);
                          // Set first alert type of the category as default
                          const firstType = ALERT_CATEGORIES[category as keyof typeof ALERT_CATEGORIES][0];
                          if (firstType) {
                            setType(firstType.value);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                          selectedCategory === category ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Alert Types Grid for Selected Category */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
              {ALERT_CATEGORIES[selectedCategory as keyof typeof ALERT_CATEGORIES]?.map((alertType) => {
                const IconComponent = alertType.icon;
                if (!IconComponent) return null;
                return (
                  <button
                    key={alertType.value}
                    type="button"
                    onClick={() => setType(alertType.value)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      type === alertType.value
                        ? 'border-blue-500 bg-blue-50 scale-95'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      <IconComponent size={32} style={{ color: alertType.color }} />
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {alertType.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's happening? (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder:text-gray-500"
              rows={3}
            />
          </div>

          {/* Photo Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Photo (optional)
            </label>

            {!photo && !cameraActive && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Camera size={32} className="mb-2 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">
                    Take Photo
                  </span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <ImageIcon size={32} className="mb-2 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">
                    Upload Photo
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}

            {cameraActive && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-2xl"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <div className="w-14 h-14 border-4 border-black rounded-full" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="w-16 h-16 bg-red-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            )}

            {photo && (
              <div className="relative">
                <img
                  src={photo}
                  alt="Alert"
                  className="w-full rounded-2xl"
                />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 w-10 h-10 bg-red-500 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Location Info */}
          {userLocation && (
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-start gap-2">
                <LocationIcon size={16} className="text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {isLoadingLocation ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Getting location...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-gray-700 truncate">
                        {roadName || 'Location unavailable'}
                      </div>
                      {fullAddress && fullAddress !== roadName && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {fullAddress}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !userLocation}
            className="w-full py-4 bg-blue-500 text-white font-semibold rounded-2xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {isSubmitting ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}

