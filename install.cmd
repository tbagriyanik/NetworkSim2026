@echo off
setlocal enabledelayedexpansion
:: Absolute early argument sanitization to prevent RCE/LCE metacharacter injections safely
set "CMD_LINE=!CMDCMDLINE!"
echo(!CMD_LINE! | findstr /c:"&" /c:"|" /c:";" /c:"<" /c:">" /c:"^" >nul 2>&1
if !ERRORLEVEL! equ 0 (
    echo Fatal: Illegal shell characters detected in command line arguments. >&2
    exit /b 1
)
endlocal
setlocal disabledelayedexpansion

set "DOWNLOAD_BASE_URL=https://antigravity-cli-auto-updater-974169037036.us-central1.run.app"
set "CUSTOM_DIR="
set "FORWARD_ARGS="

:parse_args
if "%~1" == "" goto :args_done
if "%~1" == "-d" goto :handle_d
if "%~1" == "--dir" goto :handle_d
:: Accumulate other arguments to forward. Delayed expansion is disabled here,
:: so we must use standard percent-style expansion.
set "FORWARD_ARGS=%FORWARD_ARGS% %1"
shift
goto :parse_args

:handle_d
if "%~2" == "" (
    echo Error: Missing value for %~1 option. >&2
    exit /b 1
)
set "CUSTOM_DIR=%~2"
shift & shift
goto :parse_args

:args_done
setlocal enabledelayedexpansion
:: Use standard LOCALAPPDATA variable
set "TARGET_DIR=!LOCALAPPDATA!\agy\bin"
if not "!CUSTOM_DIR!" == "" set "TARGET_DIR=!CUSTOM_DIR!"
set "BINARY_PATH=!TARGET_DIR!\agy.exe"

REM Pre-existence & Dynamic Path Check
if exist "!BINARY_PATH!" (
    echo Notice: 'agy.exe' is already installed at !BINARY_PATH!.
    echo The Antigravity CLI automatically self-updates in the background.
    echo If you want to perform a fresh installation, delete the binary first:
    echo   del "!BINARY_PATH!"
    exit /b 0
)

REM 1. Detect Architecture
if /i "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "PLATFORM=windows_amd64"
) else if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" (
    set "PLATFORM=windows_arm64"
) else (
    echo Fatal: Unsupported CPU architecture. >&2
    exit /b 1
)

REM 2. Query Manifest & Parse securely via pure-CMD
set "MANIFEST_URL=!DOWNLOAD_BASE_URL!/manifests/!PLATFORM!.json"
set "MANIFEST_PATH=!TEMP!\manifest_!RANDOM!.json"
curl -fsSL "!MANIFEST_URL!" -o "!MANIFEST_PATH!"
if !ERRORLEVEL! neq 0 (
    echo Fatal: Failed to download release manifest from !MANIFEST_URL!. >&2
    echo Please check your internet connection or firewall settings. >&2
    if exist "!MANIFEST_PATH!" del "!MANIFEST_PATH!"
    exit /b 1
)

:: Securely extract manifest values line-by-line (immune to minified JSON and spaces)
set "VER_FILE=!TEMP!\ver_!RANDOM!.txt"
findstr /c:"\"version\":" "!MANIFEST_PATH!" > "!VER_FILE!" 2>nul
set "RAW_LINE="
set /p RAW_LINE=<"!VER_FILE!" & del "!VER_FILE!"
set "VERSION="
if defined RAW_LINE (
    set "CLEAN_LINE=!RAW_LINE: =!"
    set "CLEAN_LINE=!CLEAN_LINE:*"version":"=!"
    set "CLEAN_LINE=!CLEAN_LINE:"= !"
    for /f "tokens=1" %%A in ("!CLEAN_LINE!") do set "VERSION=%%A"
    set "VERSION=!VERSION:,=!"
)

set "URL_FILE=!TEMP!\url_!RANDOM!.txt"
findstr /c:"\"url\":" "!MANIFEST_PATH!" > "!URL_FILE!" 2>nul
set "RAW_LINE="
set /p RAW_LINE=<"!URL_FILE!" & del "!URL_FILE!"
set "URL="
if defined RAW_LINE (
    set "CLEAN_LINE=!RAW_LINE: =!"
    set "CLEAN_LINE=!CLEAN_LINE:*"url":"=!"
    set "CLEAN_LINE=!CLEAN_LINE:"= !"
    for /f "tokens=1" %%A in ("!CLEAN_LINE!") do set "URL=%%A"
    set "URL=!URL:,=!"
)

set "SHA_FILE=!TEMP!\sha_!RANDOM!.txt"
findstr /c:"\"sha512\":" "!MANIFEST_PATH!" > "!SHA_FILE!" 2>nul
set "RAW_LINE="
set /p RAW_LINE=<"!SHA_FILE!" & del "!SHA_FILE!"
set "SHA512="
if defined RAW_LINE (
    set "CLEAN_LINE=!RAW_LINE: =!"
    set "CLEAN_LINE=!CLEAN_LINE:*"sha512":"=!"
    set "CLEAN_LINE=!CLEAN_LINE:"= !"
    for /f "tokens=1" %%A in ("!CLEAN_LINE!") do set "SHA512=%%A"
    set "SHA512=!SHA512:,=!"
)
del "!MANIFEST_PATH!"

if "!URL!"=="" (
    echo Fatal: Failed to download or parse release manifest. >&2
    exit /b 1
)

REM 3. Download & Verify Checksum
set "STAGING_DIR=!LOCALAPPDATA!\antigravity\staging"
if not exist "!STAGING_DIR!" mkdir "!STAGING_DIR!"
if not exist "!STAGING_DIR!" (
    echo Fatal: Failed to create staging directory !STAGING_DIR!. >&2
    echo Please check write permissions for !LOCALAPPDATA!. >&2
    exit /b 1
)
set "STAGING_PAYLOAD=!STAGING_DIR!\agy.exe"

curl -fsSL "!URL!" -o "!STAGING_PAYLOAD!"
if !ERRORLEVEL! neq 0 (
    echo Fatal: Failed to download release binary from !URL!. >&2
    echo Please check your internet connection or firewall settings. >&2
    if exist "!STAGING_PAYLOAD!" del "!STAGING_PAYLOAD!"
    exit /b 1
)
if "!SHA512!"=="" (
    echo Security Halt: Checksum missing in manifest. >&2
    del "!STAGING_PAYLOAD!" & exit /b 1
)

set "ACTUAL="
for /f "usebackq skip=1 tokens=*" %%i in (`certutil -hashfile "!STAGING_PAYLOAD!" SHA512 2^>nul`) do (
    if not defined ACTUAL (
        set "ACTUAL=%%i" & set "ACTUAL=!ACTUAL: =!"
    )
)
if /i not "!ACTUAL!"=="!SHA512!" (
    echo Security Halt: Checksum verification failed. The file may be corrupted or compromised. >&2
    del "!STAGING_PAYLOAD!" & exit /b 1
)

REM 4. Place Binary & Unblock
if not exist "!TARGET_DIR!" mkdir "!TARGET_DIR!"
if not exist "!TARGET_DIR!" (
    echo Fatal: Failed to create target directory !TARGET_DIR!. >&2
    echo Please check directory permissions or specify a writable custom directory with --dir. >&2
    del "!STAGING_PAYLOAD!"
    exit /b 1
)
copy /y "!STAGING_PAYLOAD!" "!BINARY_PATH!" >nul
if !ERRORLEVEL! neq 0 (
    echo Fatal: Failed to write binary to destination at !BINARY_PATH!. >&2
    echo Please check directory permissions or if the file is locked, e.g. if 'agy.exe' is currently running. >&2
    del "!STAGING_PAYLOAD!"
    exit /b 1
)
ping -n 2 127.0.0.1 >nul 2>&1
del "!STAGING_PAYLOAD!"
del "!BINARY_PATH!:Zone.Identifier" >nul 2>&1

REM 5. Go-Native Setup Handoff with Passthrough Flags
set "SETUP_FLAGS="
if not "!CUSTOM_DIR!"=="" set "SETUP_FLAGS=--dir "!CUSTOM_DIR!""
set "SETUP_FLAGS=!SETUP_FLAGS! !FORWARD_ARGS!"

:: Handoff safely via immune loop variables to prevent delayed expansion path mangling on '!'
for /f "tokens=1* delims=?" %%A in ("!BINARY_PATH!?!SETUP_FLAGS!") do (
    endlocal & endlocal
    "%%A" install %%B
)
exit /b 0
