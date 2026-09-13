import sqlite3

DB_PATH = "instance/getplugged.db"  # adjust only if your DB path differs

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# check current columns
cols = cur.execute("PRAGMA table_info(user);").fetchall()
col_names = [c[1] for c in cols]
print("Existing columns:", col_names)

if "role" not in col_names:
    print("Adding role column...")
    cur.execute("ALTER TABLE user ADD COLUMN role TEXT NOT NULL DEFAULT 'user';")
    conn.commit()
    print("✅ role column added.")
else:
    print("✅ role column already exists.")

conn.close()
