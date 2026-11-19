@echo off
title Mohamed Ramshan Barber Shop System
chcp 65001 > nul
echo ========================================================
echo   MOHAMED RAMSHAN - MR BARBERS MANAGEMENT SYSTEM
echo   نظام إدارة صالون محمد رمشان الفاخر
echo ========================================================
echo.
echo جاري تشغيل النظام محلياً بدون إنترنت...
echo.

if not exist node_modules (
    echo جاري تثبيت الحزم لأول مرة...
    npm install
)

echo فتح التطبيق في المتصفح / شاشة العرض...
start http://localhost:5173
npm run dev
