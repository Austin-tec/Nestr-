#!/usr/bin/env python3
"""
Safe script to remove uploaded image records and files.

Usage: run from project root (where `data/app.db` exists):
    python scripts\clear_uploads.py

The script will:
- Read all rows from `images` table
- Print a preview and ask for confirmation
- Move/delete the image files (deletes them permanently)
- Delete rows from `images` table
- Save a CSV backup of removed filenames into `data/removed_images_<timestamp>.csv`

Be careful — this permanently deletes image files referenced by the DB.
"""
import os
import sqlite3
import csv
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'app.db')
IMAGES_DIR = os.path.join(BASE_DIR, 'NESTR PROJECT', 'nestr images')

if not os.path.exists(DB_FILE):
    print('Database file not found at', DB_FILE)
    raise SystemExit(1)

conn = sqlite3.connect(DB_FILE)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute('SELECT id, property_id, filename FROM images')
rows = cur.fetchall()

if not rows:
    print('No uploaded images found in the database.')
    conn.close()
    raise SystemExit(0)

print(f'Found {len(rows)} image(s) in the database. Preview:')
for r in rows[:50]:
    print(f"- id={r['id']}, property_id={r['property_id']}, filename={r['filename']}")
if len(rows) > 50:
    print('... (truncated)')

confirm = input('Proceed to delete these image files and DB records? Type "YES" to confirm: ')
if confirm.strip() != 'YES':
    print('Aborted by user. No changes made.')
    conn.close()
    raise SystemExit(0)

# Prepare backup CSV
os.makedirs(DATA_DIR, exist_ok=True)
backup_file = os.path.join(DATA_DIR, f'removed_images_{datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")}.csv')
with open(backup_file, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['id', 'property_id', 'filename', 'file_existed', 'deleted'])

    removed_count = 0
    for r in rows:
        fid = r['id']
        prop = r['property_id']
        fn = r['filename']
        file_path = os.path.join(IMAGES_DIR, fn) if fn else None
        file_existed = os.path.exists(file_path) if file_path else False
        deleted = False
        try:
            # delete the file if it exists
            if file_existed:
                os.remove(file_path)
                deleted = True
        except Exception as e:
            print(f'Failed to remove file {file_path}:', e)
            deleted = False
        # delete DB row
        try:
            cur.execute('DELETE FROM images WHERE id = ?', (fid,))
            removed_count += 1
        except Exception as e:
            print(f'Failed to delete DB row id={fid}:', e)
        writer.writerow([fid, prop, fn, file_existed, deleted])

conn.commit()
conn.close()

print(f'Completed. Removed {removed_count} image DB row(s).')
print('Backup CSV saved to:', backup_file)
print('Done.')
