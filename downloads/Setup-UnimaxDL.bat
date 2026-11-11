@echo off
setlocal enabledelayedexpansion
title UnimaxDL Setup and Launcher

echo ========================================================
echo        UnimaxDL Native Desktop Engine v1.0.0
echo             Automated 1-Click Setup Script
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "INSTALL_DIR=%LOCALAPPDATA%\Programs\UnimaxDL"
set "USER_BIN_DIR=%APPDATA%\UnimaxDL\bin"
set "EXE_TARGET="

if not exist "!USER_BIN_DIR!" (
    mkdir "!USER_BIN_DIR!" >nul 2>&1
)

echo [*] Checking for UnimaxDL installation...

if exist "!SCRIPT_DIR!UnimaxDL-Setup-v1.0.0.exe" (
    echo [*] Found UnimaxDL-Setup-v1.0.0.exe installer.
    echo [*] Installing UnimaxDL silently...
    start /wait "" "!SCRIPT_DIR!UnimaxDL-Setup-v1.0.0.exe" /S
    timeout /t 2 /nobreak >nul
)

if exist "!INSTALL_DIR!\UnimaxDL.exe" (
    set "EXE_TARGET=!INSTALL_DIR!\UnimaxDL.exe"
    echo [OK] Detected installed binary at: !EXE_TARGET!
) else if exist "!SCRIPT_DIR!dist\win-unpacked\UnimaxDL.exe" (
    set "EXE_TARGET=!SCRIPT_DIR!dist\win-unpacked\UnimaxDL.exe"
    echo [OK] Detected local binary at: !EXE_TARGET!
) else if exist "!SCRIPT_DIR!UnimaxDL.exe" (
    set "EXE_TARGET=!SCRIPT_DIR!UnimaxDL.exe"
    echo [OK] Detected portable binary at: !EXE_TARGET!
)

if not defined EXE_TARGET (
    echo [*] Application files not installed yet.
    if exist "!SCRIPT_DIR!UnimaxDL-Setup-v1.0.0.exe" (
        echo [*] Launching installer UI...
        start "" "!SCRIPT_DIR!UnimaxDL-Setup-v1.0.0.exe"
        goto :finalize
    ) else (
        echo [!] Downloading UnimaxDL Setup Executable from Fastly CDN...
        curl.exe -L -o "!SCRIPT_DIR!UnimaxDL-Setup-v1.0.0.exe" "https://unimaxdl.github.io/downloads/UnimaxDL-Setup-v1.0.0.exe"
        if exist "!SCRIPT_DIR!UnimaxDL-Setup-v1.0.0.exe" (
            echo [OK] Download complete. Running installer...
            start "" "!SCRIPT_DIR!UnimaxDL-Setup-v1.0.0.exe"
            goto :finalize
        )
    )
)

echo.
echo [*] Checking yt-dlp media engine...
where yt-dlp.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] yt-dlp detected in system PATH.
) else if exist "!USER_BIN_DIR!\yt-dlp.exe" (
    echo [OK] yt-dlp detected in user data: !USER_BIN_DIR!\yt-dlp.exe
) else if exist "!SCRIPT_DIR!bin\win-x64\yt-dlp.exe" (
    echo [*] Copying bundled yt-dlp.exe to user storage...
    copy /y "!SCRIPT_DIR!bin\win-x64\yt-dlp.exe" "!USER_BIN_DIR!\yt-dlp.exe" >nul
    echo [OK] yt-dlp copied to: !USER_BIN_DIR!\yt-dlp.exe
) else (
    echo [*] Downloading latest yt-dlp binary from GitHub...
    curl.exe -L -s -o "!USER_BIN_DIR!\yt-dlp.exe" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    if exist "!USER_BIN_DIR!\yt-dlp.exe" (
        echo [OK] yt-dlp downloaded successfully.
    ) else (
        echo [!] Warning: Could not download yt-dlp.exe automatically.
    )
)

echo.
echo [*] Checking FFmpeg audio/video muxer...
where ffmpeg.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] FFmpeg is already installed and detected in system PATH.
) else if exist "!USER_BIN_DIR!\ffmpeg.exe" (
    echo [OK] FFmpeg detected in user storage: !USER_BIN_DIR!\ffmpeg.exe
) else if exist "!SCRIPT_DIR!bin\win-x64\ffmpeg.exe" (
    echo [*] Copying bundled FFmpeg binaries to user storage...
    copy /y "!SCRIPT_DIR!bin\win-x64\ffmpeg.exe" "!USER_BIN_DIR!\ffmpeg.exe" >nul
    copy /y "!SCRIPT_DIR!bin\win-x64\ffprobe.exe" "!USER_BIN_DIR!\ffprobe.exe" >nul
    echo [OK] FFmpeg copied to: !USER_BIN_DIR!\ffmpeg.exe
) else (
    echo [INFO] FFmpeg not found in system PATH.
    echo [*] Checking Windows Package Manager (winget)...
    where winget.exe >nul 2>&1
    if !errorlevel! equ 0 (
        echo [*] Installing FFmpeg via winget for optimal 4K muxing...
        winget install Gyan.FFmpeg --accept-package-agreements --accept-source-agreements --silent >nul 2>&1
        if !errorlevel! equ 0 (
            echo [OK] FFmpeg installed successfully via winget.
        ) else (
            echo [INFO] Winget installation skipped or already pending restart.
        )
    ) else (
        echo [INFO] System is ready for direct single-stream downloads.
    )
)

echo.
echo [*] Registering unimaxdl:// protocol handler in Windows Registry...
if defined EXE_TARGET (
    reg add "HKCU\Software\Classes\unimaxdl" /ve /d "URL:UnimaxDL Protocol" /f >nul 2>&1
    reg add "HKCU\Software\Classes\unimaxdl" /v "URL Protocol" /d "" /f >nul 2>&1
    reg add "HKCU\Software\Classes\unimaxdl\DefaultIcon" /ve /d "\"!EXE_TARGET!\",0" /f >nul 2>&1
    reg add "HKCU\Software\Classes\unimaxdl\shell\open\command" /ve /d "\"!EXE_TARGET!\" \"%%1\"" /f >nul 2>&1
    echo [OK] Protocol unimaxdl:// registered. Deep links will open UnimaxDL.
)

echo.
echo [*] Creating Desktop Shortcut...
if defined EXE_TARGET (
    set "DESKTOP_DIR=%USERPROFILE%\Desktop"
    set "SHORTCUT_PATH=!DESKTOP_DIR!\UnimaxDL.lnk"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('!SHORTCUT_PATH!'); $s.TargetPath = '!EXE_TARGET!'; $s.WorkingDirectory = [System.IO.Path]::GetDirectoryName('!EXE_TARGET!'); $s.Description = 'UnimaxDL Universal Video and Audio Downloader'; $s.Save()" >nul 2>&1
    if exist "!SHORTCUT_PATH!" (
        echo [OK] Desktop shortcut created: !SHORTCUT_PATH!
    )
)

echo.
echo ========================================================
echo         Setup Finished Successfully!
echo ========================================================
echo.
if defined EXE_TARGET (
    echo [*] Launching UnimaxDL...
    start "" "!EXE_TARGET!"
)

:finalize
echo.
echo Setup complete. This window will close in 3 seconds...
timeout /t 3 /nobreak >nul
exit /b 0
