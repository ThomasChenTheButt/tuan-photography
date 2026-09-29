#!/bin/bash
# 雙擊這個檔案就會更新並打開照片清單。看完關掉這個終端機視窗即可。
cd "$(dirname "$0")" || exit 1
python3 tools/finder_view.py >/dev/null 2>&1
python3 tools/photo_list.py && open originals/photo-list.html
