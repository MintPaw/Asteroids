start "" http://127.0.0.1:8980/bin
@echo off
echo.
echo.
echo.
echo.
echo Game being served, visit "http://127.0.0.1:8980/bin" to play.
echo Close this window or press Ctrl-C to stop serving.
echo.
echo.
echo.
echo.
taskkill /im python.exe /f > nul
if exist %appdata%\..\Local\Programs\Python\Python36-32 (
	set py=%appdata%\..\Local\Programs\Python\Python36-32\python.exe
) else (
	set py=%appdata%\..\Local\Programs\Python\Python36\python.exe
)
%py% -m http.server 8980
