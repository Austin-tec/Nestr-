import sqlite3
import os

DB = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'app.db')
if not os.path.exists(DB):
    print('Database not found at', DB)
    raise SystemExit(1)

conn = sqlite3.connect(DB)
cur = conn.cursor()
cur.execute('SELECT id, email, password, role FROM users')
rows = cur.fetchall()
if not rows:
    print('No users found')
else:
    for r in rows:
        print(r)
conn.close()
