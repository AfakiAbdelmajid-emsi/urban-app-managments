'use client';

import { useState } from 'react';
import { User, LogOut, Settings, Bell, Shield, Mail, Calendar, MapPin } from 'lucide-react';

interface ProfilePageProps {
  token: string | null;
  onLogout: () => void;
  onLogin: () => void;
}

export default function ProfilePage({ token, onLogout, onLogin }: ProfilePageProps) {
  const [user] = useState<{ email?: string; name?: string } | null>(
    token ? { email: 'user@example.com', name: 'John Doe' } : null
  );

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-4">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
          <User size={48} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome!</h2>
        <p className="text-gray-500 text-center mb-8">
          Sign in to access your profile and manage your alerts
        </p>
        <button
          onClick={onLogin}
          className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-2xl hover:bg-blue-600 transition-colors shadow-lg"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-6 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30">
            <User size={40} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              {user?.name || 'User'}
            </h2>
            <p className="text-white/80 text-sm">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 -mt-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">12</div>
            <div className="text-xs text-gray-500">Alerts Created</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-2xl font-bold text-gray-700">45</div>
            <div className="text-xs text-gray-500">Confirmations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">8</div>
            <div className="text-xs text-gray-500">Reports</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-6 space-y-2">
        <button className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors text-left">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-700">Notifications</div>
            <div className="text-sm text-gray-500">Manage alert notifications</div>
          </div>
        </button>

        <button className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors text-left">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Settings size={20} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-700">Settings</div>
            <div className="text-sm text-gray-500">App preferences</div>
          </div>
        </button>

        <button className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors text-left">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-green-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-700">Privacy & Security</div>
            <div className="text-sm text-gray-500">Manage your privacy</div>
          </div>
        </button>

        <button className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors text-left">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <MapPin size={20} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-700">My Locations</div>
            <div className="text-sm text-gray-500">Saved locations</div>
          </div>
        </button>

        <button className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors text-left">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar size={20} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-700">Activity History</div>
            <div className="text-sm text-gray-500">View your activity</div>
          </div>
        </button>
      </div>

      {/* Logout Button */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 font-semibold rounded-2xl hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
