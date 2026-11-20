@echo off
chcp 65001 > nul
title إنشاء اختصار سطح المكتب - صالون محمد رمضان
echo ====================================================
echo        إنشاء أيقونة صالون محمد رمضان على سطح المكتب
echo ====================================================
echo.

powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $desktop = [System.Environment]::GetFolderPath('Desktop'); $Shortcut = $WshShell.CreateShortcut($desktop + '\صالون محمد رمضان.lnk'); $Shortcut.TargetPath = '%~dp0..\تشغيل_الصالون.bat'; $Shortcut.WorkingDirectory = '%~dp0..'; $Shortcut.WindowStyle = 7; $Shortcut.Description = 'نظام إدارة صالون محمد رمضان'; $Shortcut.Save();"

echo.
echo ====================================================
echo  [تم بنجاح] ظهرت الآن أيقونة «صالون محمد رمضان» على سطح المكتب!
echo  يمكن للعميل الضغط مرتين عليها لفتح السيستم في أي وقت.
echo ====================================================
echo.
pause
