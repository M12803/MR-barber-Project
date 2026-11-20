@echo off
chcp 65001 > nul
title إنشاء اختصار سطح المكتب - صالون محمد رمضان
echo ====================================================
echo        إنشاء أيقونة صالون محمد رمضان على سطح المكتب
echo ====================================================
echo.

rem 1. Try VBScript method (Native Windows 7, 8, 10, 11)
cscript //nologo "%~dp0create_shortcut.vbs" > nul 2>&1

rem 2. Fallback to PowerShell SpecialFolders
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -COM WScript.Shell);$d=$s.SpecialFolders.Item('Desktop');$p=(Resolve-Path '%~dp0..').Path;$lnk=$s.CreateShortcut(\"$d\صالون محمد رمضان.lnk\");$lnk.TargetPath=\"$p\تشغيل_الصالون.bat\";$lnk.WorkingDirectory=\"$p\";$lnk.Save()" > nul 2>&1

echo.
echo ====================================================
echo  [تم بنجاح] ظهرت الآن أيقونة «صالون محمد رمضان» على سطح المكتب!
echo ====================================================
echo.
pause
