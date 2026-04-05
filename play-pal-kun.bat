@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo パルくんのにげろ！ をブラウザで開きます。
echo この黒いウィンドウを閉じるとゲームは表示できなくなります（サーバー停止）。
echo.

REM サーバー起動と同時に、1秒後に既定ブラウザで開く
start /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://localhost:8765/games/20260324_pal-kun-nigero/index.html'"

py -3 -m http.server 8765
if errorlevel 1 (
  echo.
  echo Python が見つかりませんでした。python.org から Python を入れるか、
  echo 次の URL を「既にサーバーがある環境」で開いてください。
  echo http://localhost:8765/games/20260324_pal-kun-nigero/index.html
  pause
)
