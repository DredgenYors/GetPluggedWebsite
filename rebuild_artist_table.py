import sqlite3

DB_PATH = "instance/getplugged.db"

def colnames(conn, table):
    return [r[1] for r in conn.execute(f"PRAGMA table_info({table});").fetchall()]

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys=OFF;")  # important during rebuild
    cur = conn.cursor()

    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
    if "artist" not in tables:
        raise RuntimeError("No 'artist' table found. Check DB_PATH.")

    print("Found tables:", tables)
    print("Artist columns before:", colnames(conn, "artist"))

    # 1) Rename old table
    cur.execute("ALTER TABLE artist RENAME TO artist_old;")

    # 2) Create new artist table WITHOUT active
    cur.execute("""
        CREATE TABLE artist (
            id INTEGER NOT NULL PRIMARY KEY,
            display_name VARCHAR(200) NOT NULL,
            instagram_handle VARCHAR(200)
        );
    """)

    # 3) Copy data from old -> new (only matching columns)
    old_cols = colnames(conn, "artist_old")
    keep_cols = [c for c in ["id", "display_name", "instagram_handle"] if c in old_cols]

    cols_csv = ", ".join(keep_cols)
    cur.execute(f"INSERT INTO artist ({cols_csv}) SELECT {cols_csv} FROM artist_old;")

    # 4) Drop old table
    cur.execute("DROP TABLE artist_old;")

    conn.commit()
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.close()

    print("Rebuild complete.")
    print("Artist columns after:", keep_cols)

if __name__ == "__main__":
    main()
