# ✅ Backend URL Switching - Implementation Complete

## 🎯 What Was Changed

### ✅ Created Centralized Config
- **New file:** `frontend/src/lib/config.ts`
  - Reads `NEXT_PUBLIC_BACKEND_URL` from environment variables
  - Defaults to Railway backend if not set
  - Provides `BACKEND_URL`, `SOCKET_URL`, and `getBackendUrl()` helper

### ✅ Updated API Calls
- **Modified:** `frontend/src/lib/api.ts`
  - Now imports and uses `getBackendUrl()` from config
  - All API endpoints automatically use the configured backend

### ✅ Updated Socket Connection
- **Modified:** `frontend/src/hooks/useSocket.ts`
  - Now imports and uses `SOCKET_URL` from config
  - Socket.IO automatically connects to the configured backend

### ✅ Created Helper Scripts
- **Windows:** `dev-local.bat` and `dev-railway.bat`
- **Mac/Linux:** `dev-local.sh` and `dev-railway.sh`
- Simply run the script to switch backends instantly!

### ✅ Created Documentation
- `BACKEND_SWITCHING_GUIDE.md` - Complete guide with all methods
- `QUICK_SWITCH.md` - Quick reference guide

---

## 🚀 How to Use (Choose Your Method)

### Method 1: Helper Scripts (Easiest! ⭐)

**Windows:**
```bash
cd frontend
dev-local.bat      # Switch to local backend
dev-railway.bat    # Switch to Railway backend
```

**Mac/Linux:**
```bash
cd frontend
chmod +x dev-local.sh dev-railway.sh  # First time only
./dev-local.sh     # Switch to local backend
./dev-railway.sh   # Switch to Railway backend
```

### Method 2: .env.local File (Recommended for Persistent Switch)

Create `frontend/.env.local`:

**For Local:**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

**For Railway:**
```env
NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app
```

Then run: `npm run dev`

### Method 3: Environment Variable (One-time)

```bash
# Local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000 npm run dev

# Railway
NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app npm run dev
```

---

## ✅ Default Behavior

- **No configuration** → Uses **Railway backend** (default)
- **With `.env.local`** → Uses URL from `NEXT_PUBLIC_BACKEND_URL`
- **With helper scripts** → Overrides for that session

---

## 🔍 Verification

After switching, check your browser console. You should see:

```
🔧 Backend Configuration:
   BACKEND_URL: http://localhost:3000
   SOCKET_URL: http://localhost:3000
   Using: LOCAL
```

And when connecting:
```
🔌 Connecting to Socket.IO server: http://localhost:3000
```

---

## 📝 Before Deployment Checklist

1. **Set environment variable in your hosting platform:**
   - Vercel: Project Settings → Environment Variables
   - Railway: Service → Variables tab
   - Add: `NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app`

2. **Verify backend CORS settings:**
   - Make sure `backend/src/main.ts` allows your frontend domain
   - Check CORS origin includes your production frontend URL

3. **Test the connection:**
   - Check browser console for configuration logs
   - Verify API calls are working
   - Verify Socket.IO connection is established

---

## ⚠️ Important Notes

1. **`.env.local` is gitignored** - Won't be committed (good!)
2. **Must use `NEXT_PUBLIC_` prefix** - Required for Next.js client-side env vars
3. **Restart required** - Must restart dev server after changing `.env.local`
4. **No trailing slash** - Don't add `/` at the end of URLs

---

## 🎉 You're All Set!

You can now easily switch between local and Railway backends:
- Use helper scripts for instant switching
- Use `.env.local` for persistent configuration
- Default is Railway (production-ready by default)

**Next time you want to switch:**
1. **Quick switch:** Run `dev-local.bat` or `dev-railway.bat`
2. **Persistent switch:** Edit `.env.local` and restart
3. **One-time:** Use environment variable when running npm




