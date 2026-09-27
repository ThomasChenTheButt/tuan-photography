#!/bin/bash
# 雙擊這個檔案就會開啟 tuan photography。關掉這個終端機視窗即可停止。
cd "$(dirname "$0")" || exit 1
PORT=8642

if lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "伺服器已經在 $PORT 執行中，直接開啟頁面…"
else
  python3 "$(dirname "$0")/serve.py" "$PORT" >/dev/null 2>&1 &
  sleep 1
fi

open "http://localhost:$PORT"

echo
echo "  tuan photography：http://localhost:$PORT"
echo
echo "要停止伺服器，關掉這個視窗，或按 Ctrl+C。"
wait
