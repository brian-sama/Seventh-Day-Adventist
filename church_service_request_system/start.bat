@echo off
echo =======================================================
echo    Church Service Request System - Startup Script
echo =======================================================

echo Starting Django Backend Server on port 8080...
start "Backend" cmd /k "cd backend && ..\venv\Scripts\python manage.py runserver 8080"

echo Starting Vite React Frontend on port 5173...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting up in separate terminal windows!
echo The frontend dashboard will be available at: http://localhost:5173
echo.
echo -------------------------------------------------------
echo  Test Accounts created for your manual verification:
echo  -------------------------------------------------------
echo  ROLE     !  USERNAME  !  PASSWORD
echo  -------------------------------------------------------
echo  Clerk    !  clerk1    !  password123
echo  Elder    !  elder1    !  password123
echo  Pastor   !  pastor1   !  password123
echo.
echo NOTE: WhatsApp notification currently prints dummy mock messages 
echo       into the backend terminal window until a Twilio key is provided!
echo =======================================================
pause
