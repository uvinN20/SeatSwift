@echo off
setlocal
cd /d "%~dp0"
if not defined DB_USERNAME set "DB_USERNAME=root"
where mysql >nul 2>nul
if errorlevel 1 (
  echo MySQL client was not found. Add the MySQL bin folder to PATH and try again.
  exit /b 1
)
echo Enter your MySQL password when prompted.
mysql -u "%DB_USERNAME%" -p < "db\INSTALL_OR_UPGRADE.sql"
if errorlevel 1 (
  echo Database setup failed. Read the MySQL error above before starting the backend.
  exit /b 1
)
echo Database is ready. Run run-backend.cmd next.
