"""Production entry point.

The Flask development server started from getpluggedv1.py (`python
getpluggedv1.py`) is fine for local development but isn't hardened or
tuned for handling real traffic - Flask's own docs say not to use it in
production. This runs the same `app` object through waitress, a
pure-Python production WSGI server, instead.

Usage:
    python wsgi.py
    (or, equivalently: waitress-serve --host=0.0.0.0 --port=8000 wsgi:app)

Environment variables:
    HOST - interface to bind to (default 0.0.0.0, i.e. reachable from
           outside the machine - appropriate here since a real deployment
           needs to accept traffic, unlike the dev server's localhost-only
           default)
    PORT - port to listen on (default 8000)
"""
import os

from getpluggedv1 import app, ensure_default_admin

if __name__ == "__main__":
    from waitress import serve

    ensure_default_admin()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    serve(app, host=host, port=port)
