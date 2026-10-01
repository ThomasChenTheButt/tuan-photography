#!/bin/bash
# 雙擊這個檔案就會開啟 tuan photography。關掉這個終端機視窗即可停止。
cd "$(dirname "$0")" || exit 1
python3 tools/finder_view.py >/dev/null 2>&1

# design 1 (the current site) on 8642, design 2 (the redesign) on 8645
for pair in "8642:design 1" "8645:design 2"; do
  PORT="${pair%%:*}"; DIR="${pair#*:}"
  if lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "$DIR 已經在 $PORT 執行中…"
  else
    python3 tools/serve.py "$PORT" "$DIR" >/dev/null &
  fi
done
sleep 1

open "http://localhost:8642"
open "http://localhost:8645"

echo
echo "  design 1（現在的網站）：http://localhost:8642"
echo "  design 2（新設計）：  http://localhost:8645"
echo
echo "要停止伺服器，關掉這個視窗，或按 Ctrl+C。"
wait
