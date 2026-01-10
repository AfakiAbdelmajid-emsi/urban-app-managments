# 🚀 Quick Backend Switch Guide

## Easiest Method: Use Helper Scripts

### Windows (PowerShell/CMD)
```bash
# For LOCAL backend
.\dev-local.bat

# For RAILWAY backend  
.\dev-railway.bat
```

### Mac/Linux (Bash)
```bash
# Make scripts executable (first time only)
chmod +x dev-local.sh dev-railway.sh

# For LOCAL backend
./dev-local.sh

# For RAILWAY backend
./dev-railway.sh
```

---

## Alternative: .env.local File

Create `frontend/.env.local`:

**For LOCAL:**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

**For RAILWAY:**
```env
NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app
```

Then run: `npm run dev`

---

## Default Behavior

- **No `.env.local` file** → Uses **Railway** backend (default)
- **`.env.local` exists** → Uses URL from `NEXT_PUBLIC_BACKEND_URL`

---

## Verify It's Working

Check browser console after starting:
```
🔧 Backend Configuration:
   BACKEND_URL: http://localhost:3000
   SOCKET_URL: http://localhost:3000
   Using: LOCAL
```

---

📖 **Full guide:** See `BACKEND_SWITCHING_GUIDE.md` for detailed instructions

