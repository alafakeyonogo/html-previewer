#!/usr/bin/env python3
"""Serve this standalone editor on loopback; no third-party Python packages."""
import argparse
import functools
import http.server
import pathlib
import webbrowser

parser = argparse.ArgumentParser(description="Mona HTML visual editor")
parser.add_argument("--port", type=int, default=8765)
parser.add_argument("--no-open", action="store_true")
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
http.server.SimpleHTTPRequestHandler.extensions_map.update({".js": "text/javascript; charset=utf-8"})
server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler)
url = f"http://127.0.0.1:{server.server_port}"
print(f"Mona HTML 编辑器: {url}\n按 Ctrl+C 停止。", flush=True)
if not args.no_open:
    webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
