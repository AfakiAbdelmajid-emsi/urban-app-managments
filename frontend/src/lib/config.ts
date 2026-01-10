/**
 * Backend Configuration
 * 
 * To switch between local and Railway backend:
 * 1. For LOCAL development: Create .env.local with NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
 * 2. For RAILWAY production: Create .env.local with NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app
 * 
 * Or set the environment variable directly before running:
 * - Local: NEXT_PUBLIC_BACKEND_URL=http://localhost:3000 npm run dev
 * - Railway: NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app npm run dev
 */

// Default values (Railway production is default)
const DEFAULT_RAILWAY_URL = 'https://urban-app-managments-production.up.railway.app';
const DEFAULT_LOCAL_URL = 'http://localhost:3001';

// Get backend URL from environment variable, fallback to Railway
export const BACKEND_URL = 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  DEFAULT_LOCAL_URL;

// Socket URL uses the same backend URL (same server)
export const SOCKET_URL = BACKEND_URL;

// Helper function to construct full API URLs
export function getBackendUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${baseUrl}${cleanPath}`;
}

// Log the current backend configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Backend Configuration:');
  console.log('   BACKEND_URL:', BACKEND_URL);
  console.log('   SOCKET_URL:', SOCKET_URL);
  console.log('   Using:', BACKEND_URL === DEFAULT_LOCAL_URL ? 'LOCAL' : 'RAILWAY');
}

