#!/bin/bash
echo ""
echo "============================================"
echo "  Switching to LOCAL Backend"
echo "============================================"
echo ""
export NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
echo "Backend URL set to: http://localhost:3000"
echo ""
echo "Starting development server..."
echo ""
npm run dev

