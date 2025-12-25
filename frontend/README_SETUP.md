# Alert Map - Setup Instructions

## Environment Variables Setup

Create a `.env.local` file in the `frontend` directory with the following variables:

```env
# Backend API URL - Railway Production (Default)
NEXT_PUBLIC_API_URL=https://urban-app-managments-production.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app

# Socket.IO Server URL - Railway Production (Default)
NEXT_PUBLIC_SOCKET_URL=https://urban-app-managments-production.up.railway.app

# Mapbox Token (Required)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

**Note:** If you don't create `.env.local`, the app will automatically use the Railway production backend URL as the default.

### Getting a Mapbox Token

1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for a free account
3. Navigate to your [Account page](https://account.mapbox.com/)
4. Copy your **Default public token**
5. Paste it in the `.env.local` file

## Running the Application

**Note:** The frontend is configured to use the Railway production backend by default. No local backend setup is required.

1. **Start the Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

The frontend will automatically connect to the Railway production backend:
- API requests: `https://urban-app-managments-production.up.railway.app`
- WebSocket connections: `https://urban-app-managments-production.up.railway.app`

## Features

### Mobile-First Design
- 📱 Optimized for mobile devices
- 🗺️ Interactive Mapbox map with alerts
- 📸 Camera integration for photos
- 🖼️ Image upload support
- ⚡ Real-time updates via Socket.IO

### Alert Types
- 🚗 Accident
- 🔥 Fire
- 🌊 Flood
- ⚠️ Crime
- 🏥 Medical
- 📍 Other

### User Actions
- Create alerts with location, type, description, and photo
- View all alerts on map
- Confirm/deny alerts
- Real-time updates when new alerts are created

## API Endpoints

The app connects to these backend endpoints:

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /alerts` - Get all alerts
- `POST /alerts` - Create new alert (requires auth)
- `POST /alerts/:id/confirm` - Confirm alert (requires auth)
- `POST /alerts/:id/deny` - Deny alert (requires auth)
- `DELETE /alerts/:id` - Delete alert (requires auth)

## Socket.IO Events

- `alert_created` - New alert created
- `alert_confirmed` - Alert confirmed
- `alert_denied` - Alert denied
- `alert_deleted` - Alert deleted

## Mobile Testing

Since the app uses the Railway production backend, you can access it from any device:

1. **Using ngrok (for HTTPS on mobile)**:
   ```bash
   ngrok http 3000
   ```
   Access the ngrok URL on your mobile device

2. **Using local network**:
   - Make sure your mobile and computer are on the same network
   - Find your computer's local IP address
   - Access `http://YOUR_IP:3000` from your mobile browser

The frontend will automatically connect to the Railway backend, so no backend configuration is needed on mobile.

