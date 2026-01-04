#!/usr/bin/env python3
"""
Import `n8n-mvp/db/init_sqlite.sql` into a SQLite database file `n8n-mvp/db/food_urban_semi_urban.sqlite`.
Run: python scripts/import_sqlite.py
"""
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_FILE = ROOT / 'n8n-mvp' / 'db' / 'init_sqlite.sql'
DB_FILE = ROOT / 'n8n-mvp' / 'db' / 'food_urban_semi_urban.sqlite'

if not SQL_FILE.exists():
    print(f"SQL file not found: {SQL_FILE}")
    raise SystemExit(1)

if DB_FILE.exists():
    print(f"Removing existing DB file: {DB_FILE}")
    DB_FILE.unlink()

sql = SQL_FILE.read_text(encoding='utf-8')

# Connect and execute script
conn = sqlite3.connect(str(DB_FILE))
try:
    conn.executescript(sql)
    conn.commit()
    print(f"Imported SQL into {DB_FILE}")
    # Quick sanity checks
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM foods')
    print('Foods:', cur.fetchone()[0])
    cur.execute('SELECT COUNT(*) FROM ingredients')
    print('Ingredients:', cur.fetchone()[0])
finally:
    conn.close()