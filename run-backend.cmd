@echo off
setlocal
cd /d "%~dp0backend"
if not defined DB_USERNAME set "DB_USERNAME=root"
if not defined DB_PASSWORD (
  echo First set your MySQL password in this Command Prompt:
  echo set "DB_PASSWORD=your_mysql_password"
  exit /b 1
)
call mvn -version
if errorlevel 1 exit /b 1
call mvn spring-boot:run
