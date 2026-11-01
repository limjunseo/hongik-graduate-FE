@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-local-db.ps1" %*
if errorlevel 1 (
  echo.
  echo Backup failed. Stop the backend first and check the message above.
) else (
  echo.
  echo Backup completed.
)
pause
endlocal
