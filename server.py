#!/usr/bin/env python3
"""Static file server + SQLite API for Founder Insights."""

import http.server
import json
import sqlite3
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), 'subscribers.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS subscribers (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            email       TEXT    UNIQUE NOT NULL,
            created_at  TEXT    NOT NULL,
            last_seen   TEXT,
            visit_count INTEGER DEFAULT 1,
            user_agent  TEXT
        )
    ''')
    conn.commit()
    conn.close()


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Suppress access log spam for static files
        if self.path.startswith('/api'):
            super().log_message(fmt, *args)

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/subscribe':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length))
            except Exception:
                self._send_json({'ok': False, 'error': 'bad request'}, 400)
                return

            email = (body.get('email') or '').strip().lower()
            ua    = (body.get('user_agent') or '')[:300]

            if not email or '@' not in email:
                self._send_json({'ok': False, 'error': 'invalid email'}, 400)
                return

            now = datetime.now(timezone.utc).isoformat()
            conn = get_db()
            try:
                conn.execute(
                    '''INSERT INTO subscribers (email, created_at, last_seen, visit_count, user_agent)
                       VALUES (?, ?, ?, 1, ?)''',
                    (email, now, now, ua)
                )
                conn.commit()
                status = 'created'
            except sqlite3.IntegrityError:
                conn.execute(
                    '''UPDATE subscribers
                       SET last_seen = ?, visit_count = visit_count + 1
                       WHERE email = ?''',
                    (now, email)
                )
                conn.commit()
                status = 'updated'
            finally:
                conn.close()

            self._send_json({'ok': True, 'status': status})
        else:
            self._send_json({'ok': False, 'error': 'not found'}, 404)

    def do_GET(self):
        if self.path == '/api/subscribers':
            conn = get_db()
            rows = conn.execute(
                'SELECT * FROM subscribers ORDER BY created_at DESC'
            ).fetchall()
            conn.close()
            self._send_json([dict(r) for r in rows])
        else:
            super().do_GET()


if __name__ == '__main__':
    init_db()
    port = 3000
    server = http.server.HTTPServer(('', port), Handler)
    print(f'Founder Insights server running at http://localhost:{port}')
    server.serve_forever()
