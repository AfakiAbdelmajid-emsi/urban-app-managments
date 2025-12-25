/**
 * Decode JWT token to get payload
 * Note: This is a simple base64 decode, not verification
 * For production, verify tokens on the backend
 */
export function decodeJWT(token: string): { id?: string; [key: string]: any } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

