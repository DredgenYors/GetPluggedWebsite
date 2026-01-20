import sqlite3

paths = ["instance/getplugged.db", "getplugged.db"]

for p in paths:
    try:
        conn = sqlite3.connect(p)
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
        print(p, "=>", tables)
    except Exception as e:
        print(p, "=> ERROR:", e)
