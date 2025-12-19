// All API calls go through Next.js API routes which proxy to the NestJS backend
export const api = {
  // Auth endpoints
  async login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
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
    const res = await fetch('/api/auth/register', {
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
  async getAllAlerts() {
    const res = await fetch('/api/alerts');
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async createAlert(token: string, data: any) {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create alert');
    return res.json();
  },

  async confirmAlert(token: string, id: string) {
    const res = await fetch(`/api/alerts/${id}/confirm`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to confirm alert');
    return res.json();
  },

  async denyAlert(token: string, id: string) {
    const res = await fetch(`/api/alerts/${id}/deny`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to deny alert');
    return res.json();
  },

  async deleteAlert(token: string, id: string) {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete alert');
    return res.json();
  },

  // AI endpoints
  async askAI(token: string, message: string) {
    const res = await fetch('/api/ai/ask', {
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
    const res = await fetch(`/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async getUserAlerts(token: string, userId: string) {
    // Get all alerts and filter by userId
    const res = await fetch('/api/alerts', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch user alerts');
    const allAlerts = await res.json();
    return allAlerts.filter((alert: any) => alert.userId === userId);
  },
};

