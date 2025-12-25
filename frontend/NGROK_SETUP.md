# Ngrok Setup Guide for Socket.IO

This guide explains how to set up ngrok to make Socket.IO work on mobile devices.

## Problem
When accessing the app via ngrok on mobile, Socket.IO cannot connect to `localhost:3001` because:
- Mobile device doesn't know what "localhost" means on your computer
- Backend needs to be accessible from the internet

## Solution Options

### Option 1: Expose Backend via Separate Ngrok Tunnel (Recommended)

1. **Expose Backend:**
   ```bash
   ngrok http 3001
   ```

2. **Expose Frontend:**
   ```bash
   ngrok http 3000
   ```

3. **Update Frontend Environment:**
   Create or update `.env.local` in the `frontend` directory:
   ```env
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-ngrok-url.ngrok.io
   ```

4. **Restart Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Option 2: Use ngrok with a Static Domain (Easier)

1. **Get a free ngrok static domain:**
   - Sign up at https://dashboard.ngrok.com
   - Get a free static domain

2. **Expose Backend:**
   ```bash
   ngrok http 3001 --domain=your-backend-domain.ngrok-free.app
   ```

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.ngrok-free.app
   ```

### Option 3: Tunnel Both Through Same Ngrok (Advanced)

Use a tool like `ngrok` with path-based routing or use a reverse proxy setup.

## Environment Variables

Create `frontend/.env.local`:

```env
# Socket.IO backend URL
# For localhost: http://localhost:3001
# For ngrok: https://your-backend-ngrok-url.ngrok.io
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Mapbox token
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

## Testing

1. **Desktop (Localhost):**
   - Should connect automatically to `localhost:3001`
   - No configuration needed

2. **Mobile (Ngrok):**
   - Set `NEXT_PUBLIC_SOCKET_URL` to your backend ngrok URL
   - Access frontend via frontend ngrok URL
   - Socket should connect to backend ngrok URL

## Debugging

Check browser console for Socket.IO connection messages:
- ✅ Socket connected - Connection successful
- ❌ Socket connection error - Check URL and CORS
- 🔄 Reconnection attempt - Connection lost, attempting to reconnect

## Important Notes

- **Never commit `.env.local`** to git (it's already in `.gitignore`)
- Backend CORS is configured to allow all origins (change in production)
- Socket.IO uses WebSocket transport only (no polling)
- Connection errors are logged to console for debugging

