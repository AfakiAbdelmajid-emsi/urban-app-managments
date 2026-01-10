@echo off
echo Switching to LOCAL backend...
set NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
npm run dev
