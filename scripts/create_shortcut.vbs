Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
Set objFSO = CreateObject("Scripting.FileSystemObject")
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strRootDir = objFSO.GetParentFolderName(strScriptDir)
strTarget = strRootDir & "\تشغيل_الصالون.bat"

Set oShellLink = WshShell.CreateShortcut(strDesktop & "\صالون محمد رمضان.lnk")
oShellLink.TargetPath = strTarget
oShellLink.WorkingDirectory = strRootDir
oShellLink.WindowStyle = 1
oShellLink.Description = "نظام إدارة صالون محمد رمضان"
oShellLink.Save
