'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  address: string;
  distance: number;
  type: 'alert';
}

interface ToastNotificationProps {
  toast: Toast | null;
  onClose: () => void;
}

export default function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  useEffect(() => {
    if (toast) {
      console.log('📬 Toast notification displayed:', toast.message);
      const timer = setTimeout(() => {
        console.log('⏰ Auto-dismissing toast notification');
        onClose();
      }, 6000); // Auto-dismiss after 6 seconds

      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 z-[100]" style={{ animation: 'slideIn 0.3s ease-out' }}>
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500 max-w-sm p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="text-red-600" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 text-base mb-1.5">
            {toast.message}
          </div>
          <div className="text-xs text-gray-600 mb-1.5 line-clamp-2">
            📍 {toast.address}
          </div>
          <div className="text-sm font-bold text-blue-600">
            {toast.distance.toFixed(1)} km away
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Close notification"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}

