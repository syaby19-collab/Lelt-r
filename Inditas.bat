@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto python
py -3 app.py
goto end
:python
python app.py
:end
pause
