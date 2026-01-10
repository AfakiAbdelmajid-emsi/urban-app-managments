#!/bin/bash
echo ""
echo "============================================"
echo "  Switching to RAILWAY Backend"
echo "============================================"
echo ""
export NEXT_PUBLIC_BACKEND_URL=https://urban-app-managments-production.up.railway.app
echo "Backend URL set to: https://urban-app-managments-production.up.railway.app"
echo ""
echo "Starting development server..."
echo ""
npm run dev

