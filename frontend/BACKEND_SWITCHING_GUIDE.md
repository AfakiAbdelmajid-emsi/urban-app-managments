# Backend URL Switching Guide

This guide explains how to easily switch between **Local Backend** and **Railway Backend** in the frontend.

## 🎯 Quick Switch Methods

### Method 1: Using .env.local file (Recommended)

1. **Create `.env.local` file** in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. **For LOCAL development**, add this to `.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
   ```

3. **For RAILWAY production**, add this to `.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app
   ```

4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Method 2: Environment Variable (One-time switch)

Run your dev server with the environment variable:

**For LOCAL:**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000 npm run dev
```

**For RAILWAY:**
```bash
NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app npm run dev
```

### Method 3: Quick Switch Scripts (Windows)

Create these batch files in the `frontend/` directory:

**`dev-local.bat`:**
```batch
@echo off
set NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
npm run dev
```

**`dev-railway.bat`:**
```batch
@echo off
set NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app
npm run dev
```

Then run:
- `dev-local.bat` for local backend
- `dev-railway.bat` for Railway backend

### Method 4: Quick Switch Scripts (Mac/Linux)

Create these shell scripts in the `frontend/` directory:

**`dev-local.sh`:**
```bash
#!/bin/bash
export NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
npm run dev
```

**`dev-railway.sh`:**
```bash
#!/bin/bash
export NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app
npm run dev
```

Make them executable:
```bash
chmod +x dev-local.sh dev-railway.sh
```

Then run:
- `./dev-local.sh` for local backend
- `./dev-railway.sh` for Railway backend

## 📝 Default Behavior

- **If no `.env.local` file exists**: Uses Railway backend by default
- **If `.env.local` exists**: Uses the URL specified in `NEXT_PUBLIC_BACKEND_URL`

## 🔍 Verification

After switching, check your browser console. You should see:

```
🔧 Backend Configuration:
   BACKEND_URL: http://localhost:3000 (or Railway URL)
   SOCKET_URL: http://localhost:3000 (or Railway URL)
   Using: LOCAL (or RAILWAY)
```

And when connecting to Socket.IO:
```
🔌 Connecting to Socket.IO server: http://localhost:3000 (or Railway URL)
```

## 🚀 For Production Deployment

When deploying to production (Vercel, Railway, etc.), set the environment variable in your hosting platform:

### Vercel:
1. Go to your project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_BACKEND_URL` = `https://urban-app-managments-production.up.railway.app`

### Railway:
1. Go to your frontend service → Variables
2. Add: `NEXT_PUBLIC_BACKEND_URL` = `https://urban-app-managments-production.up.railway.app`

## ⚠️ Important Notes

1. **`.env.local` is gitignored** - it won't be committed to git (good for secrets)
2. **Always use `NEXT_PUBLIC_` prefix** - Next.js requires this for client-side env vars
3. **Restart required** - You must restart the dev server after changing `.env.local`
4. **No trailing slash** - Don't add a trailing `/` to the URL

## 🐛 Troubleshooting

### Issue: Still connecting to wrong backend
- Make sure `.env.local` file is in the `frontend/` directory (not root)
- Restart your dev server (`Ctrl+C` then `npm run dev`)
- Clear Next.js cache: Delete `.next/` folder and restart

### Issue: Environment variable not working
- Check that you're using `NEXT_PUBLIC_` prefix
- Verify the variable name is exactly: `NEXT_PUBLIC_BACKEND_URL`
- Make sure there are no spaces around the `=` sign

### Issue: CORS errors
- Make sure your backend CORS settings allow your frontend URL
- Check `backend/src/main.ts` CORS configuration

