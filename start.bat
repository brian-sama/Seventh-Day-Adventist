@echo off
echo =======================================================
echo    Church Service Request System - Startup Script
echo =======================================================

echo Starting both servers concurrently using npm...
call npm start

echo.
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
