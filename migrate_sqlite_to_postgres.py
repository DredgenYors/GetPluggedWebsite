"""One-time migration: copy every row from the local SQLite database into
the Postgres database DATABASE_URL points at, preserving primary keys (so
foreign keys - event_artists, Media.event_id, TicketOrder.row_id - still
line up) and resetting each table's identity sequence afterward (Postgres
doesn't advance a SERIAL sequence for an explicitly-inserted id, so the
next auto-generated insert would otherwise collide with an existing row).

Run this once, after Postgres is set up and DATABASE_URL points at it, to
seed it with everything currently in instance/getplugged.db. Safe to
re-run against an empty Postgres database; NOT safe to re-run against one
that already has rows in it (would raise a primary-key conflict - which
is the right failure mode, since silently duplicating or overwriting is
worse than stopping).

Usage:
    python migrate_sqlite_to_postgres.py
"""
import sqlite3

from getpluggedv1 import (
    app, db,
    SiteSettings, User, Artist, Event, event_artists, Media,
    StayPluggedRow, TicketOrder, MarginImage,
)

SQLITE_PATH = "instance/getplugged.db"

# (model or table, whether it's a plain db.Table association rather than a
# db.Model) in parent-before-child order, so foreign keys always resolve.
TABLES = [
    (SiteSettings, False),
    (User, False),
    (Artist, False),
    (Event, False),
    (event_artists, True),
    (Media, False),
    (StayPluggedRow, False),
    (TicketOrder, False),
    (MarginImage, False),
]


def main():
    if not app.config["SQLALCHEMY_DATABASE_URI"].startswith("postgresql://"):
        raise SystemExit(
            "DATABASE_URL isn't set to a postgresql:// URL - set it to the "
            "target Postgres database first."
        )

    sqlite_con = sqlite3.connect(SQLITE_PATH)
    sqlite_con.row_factory = sqlite3.Row

    with app.app_context():
        db.create_all()  # no-op for tables that already exist, creates any that don't

        # getpluggedv1 auto-creates a default SiteSettings row the moment
        # it's imported (see get_settings(), called at module level) if the
        # table is empty - which it is, on a freshly created database, by
        # the time this import happens. Clear it before inserting the real
        # one from SQLite, or the real row (same id) collides with it.
        SiteSettings.query.delete()

        for table, is_association in TABLES:
            table_name = table.name if is_association else table.__tablename__
            rows = sqlite_con.execute(f"SELECT * FROM {table_name}").fetchall()
            if not rows:
                print(f"{table_name}: 0 rows, skipping")
                continue

            columns = rows[0].keys()
            if is_association:
                db.session.execute(
                    table.insert(),
                    [dict(row) for row in rows],
                )
            else:
                db.session.bulk_insert_mappings(
                    table, [dict(row) for row in rows]
                )
            print(f"{table_name}: inserted {len(rows)} row(s)")

        db.session.commit()

        # Advance each table's id sequence past the highest id we just
        # inserted, so the next ORM-generated insert doesn't collide. Table
        # names are double-quoted since "user" is a reserved/ambiguous
        # identifier in Postgres (bare "user" resolves to the current
        # session's username, not the table) - quoting makes every name
        # unambiguous, not just that one.
        for table, is_association in TABLES:
            if is_association or "id" not in table.__table__.columns:
                continue
            table_name = table.__tablename__
            db.session.execute(db.text(
                f'SELECT setval(pg_get_serial_sequence(\'"{table_name}"\', \'id\'), '
                f'COALESCE((SELECT MAX(id) FROM "{table_name}"), 1))'
            ))
        db.session.commit()

    sqlite_con.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
