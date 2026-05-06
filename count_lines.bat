@echo off
setlocal enabledelayedexpansion

set total=0
set filecount=0

for /r "src" %%f in (*.ts *.tsx *.js *.jsx) do (
    set /p lines=<"%%f"
    set /a linecount=0
    for /f "delims=" %%l in (%%f) do set /a linecount+=1
    set /a total+=!linecount!
    set /a filecount+=1
    echo %%f: !linecount! lines
)

echo.
echo Total files: %filecount%
echo Total lines: %total%
