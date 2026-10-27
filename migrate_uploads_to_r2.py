"""One-time migration: upload every file currently in static/uploads/ to
Cloudflare R2, then update every DB row that references a local
"uploads/..." path to point at the new R2 URL instead.

Run this once, after R2 is set up (R2_BUCKET, R2_ACCOUNT_ID,
R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL all set in the
environment) and before cutting the live site over to R2-backed storage.
Safe to re-run: re-uploading an unchanged file just overwrites the same R2
key, and rows already pointing at an R2 URL are skipped.

Usage:
    python migrate_uploads_to_r2.py
"""
import os

from getpluggedv1 import (
    app, db, USE_R2, R2_BUCKET, R2_PUBLIC_BASE_URL, _r2_client,
    SiteSettings, Event, MarginImage, Media,
)

# (model, column name) pairs that can hold a local "uploads/..." path.
IMAGE_FIELDS = [
    (SiteSettings, "logo_image"),
    (SiteSettings, "services_image"),
    (SiteSettings, "founder1_image"),
    (SiteSettings, "founder2_image"),
    (Event, "cover_image"),
    (MarginImage, "url"),
    (Media, "url"),
]


def main():
    if not USE_R2:
        raise SystemExit(
            "R2 isn't configured (R2_BUCKET/R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/"
            "R2_SECRET_ACCESS_KEY/R2_PUBLIC_BASE_URL) - set those first."
        )

    upload_dir = app.config["UPLOAD_FOLDER"]
    uploaded, skipped, updated = 0, 0, 0

    with app.app_context():
        for filename in os.listdir(upload_dir):
            local_path = os.path.join(upload_dir, filename)
            if not os.path.isfile(local_path):
                continue

            key = f"uploads/{filename}"
            with open(local_path, "rb") as f:
                _r2_client.upload_fileobj(f, R2_BUCKET, key)
            uploaded += 1
            print(f"uploaded: {filename}")

        new_url_for = lambda filename: f"{R2_PUBLIC_BASE_URL}/uploads/{filename}"

        for model, column in IMAGE_FIELDS:
            rows = model.query.all()
            for row in rows:
                value = getattr(row, column) or ""
                if not value.startswith("uploads/"):
                    skipped += 1
                    continue
                filename = value.removeprefix("uploads/")
                setattr(row, column, new_url_for(filename))
                updated += 1

        db.session.commit()

    print(f"\nDone. Uploaded {uploaded} file(s) to R2, updated {updated} "
          f"DB row(s), skipped {skipped} row(s) already elsewhere.")


if __name__ == "__main__":
    main()
