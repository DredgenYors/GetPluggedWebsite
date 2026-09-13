# Old / Unused

Everything in this folder was moved here during a codebase reorganization
(Sep 2026) because it appeared unreferenced by the live app or superseded
by newer code. Nothing was deleted — this is a holding area.

- `getplugged_old_backup/` — an earlier, self-contained snapshot of the
  whole site (own templates, own CSS, own `getpluggedv1.py`), superseded
  by the current DB-backed app.
- `getpluggedpythonanywheresourcecode.py` — an older, simpler
  session/JSON-based version of the app (no database), likely a PythonAnywhere
  deployment snapshot from before the SQLAlchemy rewrite.
- `subscribers.json` — leftover data from an email-subscription feature
  that was removed from the app.
- `getplugged_stale_root.db` — an empty SQLite file that was sitting at
  the project root; the app actually reads/writes `instance/getplugged.db`.
- `-- SQLite.sql` — an empty scratch SQL file.
- `add_role_column.py`, `rebuild_artist_table.py` — one-off DB migration
  scripts; their changes are already applied to `instance/getplugged.db`.
- `seed_super_admin.py` — a one-off admin-seeding script. **Contains a
  hardcoded plaintext email/password committed to git history** — treat
  that password as compromised, avoid reusing it anywhere, and prefer the
  in-app "create user" flow (Admin → Users, as super admin) or the
  `ensure_default_admin()` bootstrap in `getpluggedv1.py` instead.
- `templates/` (font_preview, payment, post_payment, tickets, upcoming,
  upcoming_coming_soon, upcoming_confirmed) — pages with no route in
  `getpluggedv1.py` pointing at them; not reachable from the live site.
- `static/` (GPLogo.png, GPLogo_upscayl..., gplogotext.svg,
  Portrait_Placeholder.png, updatedstyles.css) — assets/styles not
  referenced by any current template.
- `TestingHelloWorld.slnx` — a Visual Studio solution file unrelated to
  this Flask project; kept here in case it was intentional, but it looks
  like a stray file from something else.
