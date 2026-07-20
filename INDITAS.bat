@echo off
cd /d "%~dp0"
call npm install
start http://localhost:3000
start http://localhost:3000/admin
node server.js
pause
