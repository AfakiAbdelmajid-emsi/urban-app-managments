# Socket.IO Setup - Complete Solution

## ✅ Changes Made

### Frontend (`frontend/src/hooks/useSocket.ts`)

1. **Smart URL Detection:**
   - Detects if running on localhost/local network → connects to `localhost:3001`
   - Detects if running on ngrok/production → uses `NEXT_PUBLIC_SOCKET_URL` or `window.location.origin`
   - Never hardcodes localhost for non-local environments

2. **WebSocket-Only Transport:**
   - Forces WebSocket transport (`transports: ['websocket']`)
   - Disables polling (`upgrade: false`)
   - Better performance and works reliably with ngrok

3. **Enhanced Error Handling:**
   - Detailed connection error logging
   - Connection state management
   - Reconnection handling with visual feedback
   - Connection status displayed in UI

4. **Environment Variables:**
   - Uses `NEXT_PUBLIC_SOCKET_URL` when set
   - Falls back to intelligent detection
   - Works seamlessly across environments

### Backend (`backend/src/alerts/alerts.gateway.ts`)

1. **CORS Configuration:**
   - Allows all origins (`origin: true`) for WebSocket compatibility
   - Supports credentials
   - Works with both localhost and ngrok

2. **WebSocket Transport:**
   - Forces WebSocket transport only
   - Disables polling for better performance

### Backend CORS (`backend/src/main.ts`)

1. **Global CORS:**
   - Allows all origins (`origin: true`)
   - Supports credentials
   - Works with ngrok and localhost

### UI Updates (`frontend/src/app/page.tsx`)

1. **Connection Status:**
   - Visual connection indicator in header (green/red dot)
   - Error message banner when disconnected
   - Real-time connection state updates

## 🚀 Usage

### Local Development (Desktop)

**No configuration needed!** The socket hook automatically detects localhost and connects to `localhost:3001`.

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access: `http://localhost:3000`

### Mobile Testing with Ngrok

1. **Expose Backend:**
   ```bash
   ngrok http 3001
   # Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
   ```

2. **Expose Frontend:**
   ```bash
   ngrok http 3000
   # Copy the HTTPS URL (e.g., https://xyz789.ngrok.io)
   ```

3. **Configure Frontend:**
   Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_SOCKET_URL=https://abc123.ngrok.io
   NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
   ```

4. **Restart Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access on Mobile:**
   Open `https://xyz789.ngrok.io` on your mobile device.

### Production

Set environment variables:
```env
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

Or if backend is on same domain:
```env
# Leave NEXT_PUBLIC_SOCKET_URL unset - will use window.location.origin
```

## 🔍 Debugging

### Check Console Logs

The socket hook logs detailed connection information:

- `🔌 Connecting to Socket.IO server: [URL]` - Connection attempt
- `✅ Socket connected` - Successful connection
- `❌ Socket connection error: [message]` - Connection failed
- `🔄 Reconnection attempt X` - Trying to reconnect
- `❌ Socket disconnected: [reason]` - Disconnection reason

### Common Issues

1. **"Socket connection error: xhr poll error"**
   - **Solution:** Make sure `NEXT_PUBLIC_SOCKET_URL` is set correctly for ngrok
   - Backend ngrok URL must be HTTPS (not HTTP)

2. **"Socket connection error: timeout"**
   - **Solution:** Backend not accessible or CORS misconfiguration
   - Check backend is running and accessible

3. **Socket connects but immediately disconnects**
   - **Solution:** Check backend WebSocketGateway CORS settings
   - Verify token authentication if using authenticated connections

4. **Works on desktop but not mobile**
   - **Solution:** Make sure `NEXT_PUBLIC_SOCKET_URL` is set to ngrok backend URL
   - Mobile can't access `localhost:3001`

## 📋 Environment Variables Reference

### Frontend (`.env.local`)

```env
# Required for ngrok/production
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com

# Required for map
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Backend (`.env`)

```env
# Optional - defaults to 3001
PORT=3001
```

## ✅ Testing Checklist

- [ ] Desktop localhost works
- [ ] Mobile via ngrok works
- [ ] Connection status shows correctly
- [ ] Error messages display when disconnected
- [ ] Reconnection works after network interruption
- [ ] Real-time alerts update correctly
- [ ] Console logs show detailed connection info

## 🎯 Architecture

```
┌─────────────┐
│   Mobile    │
│  (ngrok)    │
└──────┬──────┘
       │ HTTPS/WSS
       ▼
┌─────────────┐      ┌─────────────┐
│   Frontend  │──────│   Backend   │
│  (Next.js)  │      │   (NestJS)  │
│  Port 3000  │      │  Port 3001  │
└─────────────┘      └─────────────┘
       │                    │
       └────────────────────┘
          Socket.IO (WSS)
```

## 📝 Notes

- **Never commit `.env.local`** - Already in `.gitignore`
- Backend CORS allows all origins for development (restrict in production)
- WebSocket transport only (no polling) for better performance
- Connection errors are logged to console for debugging
- Visual feedback shows connection status in UI

