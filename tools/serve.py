#!/usr/bin/env python3
"""tuan photography 的本機伺服器 — local preview server.

跟 python -m http.server 幾乎一樣，只多做一件事：叫瀏覽器不要快取。
少了這個，每次改完 css / js 都得手動 Cmd+Shift+R 才看得到變化。

只綁 127.0.0.1：網站還沒公開，不開放給同一個 Wi-Fi 的其他裝置。
只送出 site/ 裡的東西：原始照片、筆記、靈感都不在伺服器看得到的範圍內。

    python3 tools/serve.py                          site/ on port 8642
    python3 tools/serve.py 8643 experiments/<name>/site   an experiment, beside it
"""
import functools
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # 安靜一點，終端機只留啟動訊息


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8642
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))   # 專案資料夾
    # 第二個參數：要預覽的資料夾（從專案資料夾算起），給 experiments/ 裡的試作版用
    os.chdir(sys.argv[2] if len(sys.argv) > 2 else "site")
    handler = functools.partial(NoCacheHandler, directory=os.getcwd())
    with http.server.ThreadingHTTPServer(('127.0.0.1', port), handler) as httpd:
        httpd.serve_forever()


if __name__ == '__main__':
    main()
