start "" http://127.0.0.1:8080/bin
@echo off
echo.
echo.
echo.
echo.
echo Game being served, visit "http://127.0.0.1:8080/bin" to play.
echo Close this window or press Ctrl-C to stop serving.
echo.
echo.
echo.
echo.
python -m http.server 8080
