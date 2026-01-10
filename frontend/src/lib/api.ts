// Import backend configuration
import { getBackendUrl } from './config';

export const api = {
  // Auth endpoints
  async login(email: string, password: string) {
    const res = await fetch(getBackendUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Invalid email or password');
    }
    return res.json();
  },

  async register(email: string, password: string, username: string) {
    const res = await fetch(getBackendUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message || 'Registration failed');
    }
    return res.json();
  },

  // Alert endpoints
  async getAllAlerts(latitude?: number, longitude?: number, distanceKm?: number) {
    let url = getBackendUrl('/alerts');
    if (latitude !== undefined && longitude !== undefined && distanceKm !== undefined) {
      url += `?lat=${latitude}&lon=${longitude}&distanceKm=${distanceKm}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async createAlert(token: string, data: any) {
    const formData = new FormData();
    
    // Add all text fields
    formData.append('type', data.type);
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.roadName) {
      formData.append('roadName', data.roadName);
    }
    
    if (data.fullAddress) {
      formData.append('fullAddress', data.fullAddress);
    }
    
    // Handle photo: if it's a File, append it directly
    // If it's a base64 string, convert to File first
    if (data.photo) {
      if (data.photo instanceof File) {
        formData.append('photo', data.photo);
      } else if (typeof data.photo === 'string' && data.photo.startsWith('data:image')) {
        // Convert base64 to File for backward compatibility
        try {
          const response = await fetch(data.photo);
          const blob = await response.blob();
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          formData.append('photo', file);
        } catch (error) {
          console.error('Error converting base64 to file:', error);
          // Skip photo if conversion fails
        }
      }
    }

    const res = await fetch(getBackendUrl('/alerts'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - browser will set it with boundary for FormData
      },
      body: formData,
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to create alert' }));
      throw new Error(error.message || 'Failed to create alert');
    }
    
    return res.json();
  },

  async confirmAlert(token: string, id: string) {
    const res = await fetch(getBackendUrl(`/alerts/${id}/confirm`), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to confirm alert');
    return res.json();
  },

  async denyAlert(token: string, id: string) {
    const res = await fetch(getBackendUrl(`/alerts/${id}/deny`), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to deny alert');
    return res.json();
  },

  async deleteAlert(token: string, id: string) {
    const res = await fetch(getBackendUrl(`/alerts/${id}`), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete alert');
    return res.json();
  },

  // AI endpoints
  async askAI(token: string, message: string) {
    const res = await fetch(getBackendUrl('/ai/ask'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'AI request failed' }));
      throw new Error(error.message || 'Failed to get AI response');
    }
    return res.json();
  },

  // User endpoints
  async getUserProfile(token: string, userId: string) {
    const res = await fetch(getBackendUrl(`/users/${userId}`), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async getUserAlerts(token: string, userId: string) {
    // Get alerts filtered by userId from backend
    const res = await fetch(getBackendUrl(`/alerts?userId=${userId}`), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch user alerts');
    return res.json();
  },
};

