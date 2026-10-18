#!/usr/bin/env python3
"""tuan photography 的本機伺服器 — local preview server.

跟 python -m http.server 幾乎一樣，只多做一件事：叫瀏覽器不要快取。
少了這個，每次改完 css / js 都得手動 Cmd+Shift+R 才看得到變化。

只綁 127.0.0.1：網站還沒公開，不開放給同一個 Wi-Fi 的其他裝置。
只送出網站資料夾（design 1/）裡的東西：原始照片、筆記、靈感都不在伺服器看得到的範圍內。

    python3 tools/serve.py                          design 1/ on port 8642
    python3 tools/serve.py 8643 experiments/<name>/design 1   an experiment, beside it
    python3 tools/serve.py auto elements            "auto": the port the app hands over in PORT (8647 if none)

評分頁（好／不好、筆記）：/__reviews/<名字> 讀寫 ideas/reviews/<名字>.json。ideas/ 不上 GitHub，
所以他的筆記只留在這台 Mac；Claude 直接讀那個檔，不用他複製貼上。
Review pages (good / not, notes): GET and POST /__reviews/<name> read and write
ideas/reviews/<name>.json, private (ideas/ is gitignored), read by Claude straight from the file.
"""
import functools
import http.server
import json
import os
import re
import sys
import time

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVIEWS = os.path.join(PROJECT, 'ideas', 'reviews')
REVIEW_PATH = re.compile(r'^/__reviews/([a-z0-9-]{1,60})$')


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

    def _review_file(self):
        m = REVIEW_PATH.match(self.path.split('?')[0])
        return os.path.join(REVIEWS, m.group(1) + '.json') if m else None

    def _send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        f = self._review_file()
        if not f:
            return super().do_GET()
        try:
            with open(f, encoding='utf-8') as fh:
                return self._send_json(200, json.load(fh))
        except (OSError, ValueError):
            return self._send_json(200, {})

    def do_POST(self):
        f = self._review_file()
        if not f:
            return self.send_error(404)
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > 200_000:
            return self.send_error(413)
        try:
            data = json.loads(self.rfile.read(n).decode('utf-8'))
            if not isinstance(data, dict):
                raise ValueError
        except ValueError:
            return self.send_error(400)
        data['_saved'] = time.strftime('%Y-%m-%d %H:%M:%S')
        os.makedirs(REVIEWS, exist_ok=True)
        tmp = f + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        os.replace(tmp, f)
        return self._send_json(200, {'ok': True, 'saved': data['_saved']})


def main():
    port = sys.argv[1] if len(sys.argv) > 1 else '8642'
    # "auto": the Claude app assigns a free port through PORT, so two chats can both preview the same folder
    port = int(os.environ.get('PORT', 8647)) if port == 'auto' else int(port)
    os.chdir(PROJECT)   # 專案資料夾
    # 第二個參數：要預覽的資料夾（從專案資料夾算起），給 experiments/ 裡的試作版用
    os.chdir(sys.argv[2] if len(sys.argv) > 2 else "design 1")
    handler = functools.partial(NoCacheHandler, directory=os.getcwd())
    with http.server.ThreadingHTTPServer(('127.0.0.1', port), handler) as httpd:
        httpd.serve_forever()


if __name__ == '__main__':
    main()
