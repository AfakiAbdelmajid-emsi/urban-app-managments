'use client';

import { Map, Plus, User, AlertCircle, Bot } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'map' | 'create' | 'emergency' | 'ai' | 'profile';
  onTabChange: (tab: 'map' | 'create' | 'emergency' | 'ai' | 'profile') => void;
  onCreateClick: () => void;
  isAuthenticated: boolean;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onCreateClick,
  isAuthenticated,
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 safe-area-inset-bottom">
      {/* Background with curved notch */}
      <div className="relative h-16">
        {/* Main nav bar with curved notch using clip-path */}
        <div 
          className="absolute inset-0 bg-white border-t border-gray-200 shadow-2xl"
            
          
        />
        
        {/* Content overlay */}
        <div className="relative flex items-center justify-around h-16 px-2 z-10">
          {/* Map Tab */}
          <button
            onClick={() => onTabChange('map')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              activeTab === 'map'
                ? 'text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map size={24} strokeWidth={activeTab === 'map' ? 2.5 : 2} />
            <span className="text-xs font-medium">Map</span>
          </button>

          {/* Emergency Tab */}
          <button
            onClick={() => onTabChange('emergency')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              activeTab === 'emergency'
                ? 'text-red-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertCircle size={24} strokeWidth={activeTab === 'emergency' ? 2.5 : 2} />
            <span className="text-xs font-medium">Emergency</span>
          </button>

          {/* Spacer for center button */}
          <div className="w-16 h-16 shrink-0" />

          {/* AI Tab */}
          <button
            onClick={() => onTabChange('ai')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              activeTab === 'ai'
                ? 'text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bot size={24} strokeWidth={activeTab === 'ai' ? 2.5 : 2} />
            <span className="text-xs font-medium">AI</span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="text-xs font-medium">
              {isAuthenticated ? 'Profile' : 'Login'}
            </span>
          </button>
        </div>
      </div>

      {/* Create Alert Button (Floating in center notch) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={onCreateClick}
          className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full shadow-2xl text-white hover:bg-blue-600 active:scale-95 transition-all "
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}
