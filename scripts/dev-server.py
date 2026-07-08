# Local preview server with caching disabled.
# python -m http.server sends no Cache-Control, so Chrome heuristically caches
# pages for ~10% of file age — stale-homepage confusion. Use this instead:
#   py scripts/dev-server.py   (serves repo root on http://localhost:8080)
import http.server
import os

os.chdir(os.path.join(os.path.dirname(__file__), '..'))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # no-store ONLY for text assets — media must stay cacheable or looping
        # videos re-download on every loop/pause and playback stalls
        path = self.path.split('?')[0].lower()
        if path.endswith(('.mp4', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico')):
            self.send_header('Cache-Control', 'max-age=3600')
        else:
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()


http.server.ThreadingHTTPServer(('', 8080), NoCacheHandler).serve_forever()
