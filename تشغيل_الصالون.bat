@echo off
chcp 65001 > nul
title صالون محمد رمضان - تشغيل النظام
echo ====================================================
echo        صالون محمد رمضان - نظام إدارة الحلاقة
echo ====================================================
echo.
echo جاري بدء تشغيل النظام محلياً...

rem Start background static server via Windows PowerShell (no node or python required)
start "" /b powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1"

rem Wait 1.5 seconds for server to bind port
timeout /t 2 /nobreak > nul

rem Launch Microsoft Edge or Chrome in standalone App Mode (no URL bar, no tabs)
start msedge --app="http://localhost:5173" || start chrome --app="http://localhost:5173" || start http://localhost:5173

exit
