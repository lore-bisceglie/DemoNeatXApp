Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run "python """ & CreateObject("Scripting.FileSystemObject").GetAbsolutePathName("sniper_commenti.py") & """", 0, False 
