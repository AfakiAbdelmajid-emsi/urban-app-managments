'use client';

import { useState, useEffect } from 'react';
import { User, LogOut, Settings, Bell, Shield, Mail, Calendar, MapPin, AlertCircle, Loader2, X, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { decodeJWT } from '@/lib/jwt';
import { Alert } from '@/types/alert';

interface ProfilePageProps {
  token: string | null;
  onLogout: () => void;
  onLogin: () => void;
}

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export default function ProfilePage({ token, onLogout, onLogin }: ProfilePageProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userAlerts, setUserAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMyAlerts, setShowMyAlerts] = useState(false);
  const [stats, setStats] = useState({
    alertsCreated: 0,
    totalConfirmations: 0,
    totalDenials: 0,
  });

  // Fetch user profile and alerts
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const decoded = decodeJWT(token);
        if (!decoded?.id) {
          throw new Error('Invalid token');
        }

        // Fetch user profile
        const userData = await api.getUserProfile(token, decoded.id);
        setUser(userData);

        // Fetch user's alerts
        const alerts = await api.getUserAlerts(token, decoded.id);
        setUserAlerts(alerts);

        // Calculate stats
        const totalConfirmations = alerts.reduce((sum: number, alert: Alert) => sum + alert.confirmations, 0);
        const totalDenials = alerts.reduce((sum: number, alert: Alert) => sum + alert.denials, 0);
        setStats({
          alertsCreated: alerts.length,
          totalConfirmations,
          totalDenials,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const handleDeleteAlert = async (alertId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await api.deleteAlert(token, alertId);
      setUserAlerts((prev) => prev.filter((alert) => alert._id !== alertId));
      setStats((prev) => ({
        ...prev,
        alertsCreated: prev.alertsCreated - 1,
      }));
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert');
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500">Loading profile...</p>
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
              {user?.username || 'User'}
            </h2>
            <p className="text-white/80 text-sm">{user?.email || ''}</p>
            {user?.createdAt && (
              <p className="text-white/60 text-xs mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 -mt-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.alertsCreated}</div>
            <div className="text-xs text-gray-500">Alerts Created</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.totalConfirmations}</div>
            <div className="text-xs text-gray-500">Confirmations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.totalDenials}</div>
            <div className="text-xs text-gray-500">Denials</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-6 space-y-2">
        <button 
          onClick={() => setShowMyAlerts(!showMyAlerts)}
          className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors text-left"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-700">My Alerts</div>
            <div className="text-sm text-gray-500">
              {userAlerts.length} alert{userAlerts.length !== 1 ? 's' : ''} created
            </div>
          </div>
        </button>

        {showMyAlerts && userAlerts.length > 0 && (
          <div className="px-2 space-y-2 mb-2">
            {userAlerts.map((alert) => (
              <div
                key={alert._id}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-700 truncate">
                    {alert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  {alert.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>👍 {alert.confirmations}</span>
                    <span>👎 {alert.denials}</span>
                    <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete alert"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showMyAlerts && userAlerts.length === 0 && (
          <div className="px-2 py-4 text-center text-gray-500 text-sm">
            No alerts created yet
          </div>
        )}

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
