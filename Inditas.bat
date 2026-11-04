@echo off
title Bolti leltar - polcterkepes valtozat
cd /d "%~dp0"
echo Polcterkepes valtozat inditasa...
echo A regi leltar parancsablakat elobb zard be.
where py >nul 2>nul
if errorlevel 1 goto python
py -3 app.py
goto end
:python
python app.py
:end
pause
