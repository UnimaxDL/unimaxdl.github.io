@echo off
title UnimaxDL Local Engine
echo ======================================================
echo    UnimaxDL Engine - Local High-Speed Media Downloader
echo ======================================================
echo Starting local companion on http://127.0.0.1:8000 ...
cd /d "%~dp0server"
python start.py
pause
