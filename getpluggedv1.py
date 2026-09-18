from flask import Flask, render_template, redirect, url_for, flash, request, abort, jsonify
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy # Access database connection, instead of writing raw SQL
from forms import LoginForm, SiteSettingsForm, ArtistForm, EventForm, MediaForm
from flask_login import UserMixin, LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from wtforms.validators import DataRequired
from functools import wraps
from flask_wtf import CSRFProtect

app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///getplugged.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Admin-uploaded images (logo, founder photos, services placeholder, etc.)
app.config["UPLOAD_FOLDER"] = os.path.join(app.static_folder, "uploads")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB request cap
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

csrf = CSRFProtect(app)

db = SQLAlchemy(app)


def save_uploaded_image(file_storage, prefix):
    """Save an uploaded image under static/uploads and return its static-relative path.

    Returns None if no file was provided (caller should then leave the existing value alone).
    """
    if not file_storage or not getattr(file_storage, "filename", None):
        return None

    ext = file_storage.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return None

    filename = secure_filename(f"{prefix}-{uuid.uuid4().hex[:8]}.{ext}")
    file_storage.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    return f"uploads/{filename}"


# Whitelist of SiteSettings text columns that can be edited inline, on the page
# itself, in "Edit Mode" -> max length allowed for each (matches the model).
INLINE_TEXT_FIELDS = {
    "nav_label_mission": 50, "nav_label_services": 50, "nav_label_gallery": 50,
    "nav_label_stay_plugged": 50, "nav_label_our_story": 50, "nav_label_contact": 50,
    "nav_cta_label": 50,

    "hero_eyebrow": 200, "hero_headline": 100, "hero_subhead": 300,
    "hero_cta_primary_label": 50, "hero_cta_secondary_label": 50,

    "mission_eyebrow": 100, "mission_statement": 2000,

    "services_eyebrow": 100, "services_heading": 200,
    "service1_title": 200, "service1_body": 1000,
    "service2_title": 200, "service2_body": 1000,
    "service3_title": 200, "service3_body": 1000,
    "service4_title": 200, "service4_body": 1000,

    "gallery_eyebrow": 100, "gallery_heading": 200, "gallery_note": 300,

    "stay_plugged_eyebrow": 100, "stay_plugged_heading": 200,
    "stay_plugged_lede": 300, "stay_plugged_footer_text": 200,
    "coming_soon_title": 200, "coming_soon_body": 1000,

    # NOTE: what_is_body is intentionally excluded - it renders as multiple
    # separate <p> tags (split on blank lines), which doesn't map to a single
    # inline-editable element. Still editable from Admin > Settings.
    "our_story_eyebrow": 100, "what_is_title": 200,
    "stat1_value": 50, "stat1_label": 50,
    "stat2_value": 50, "stat2_label": 50,
    "stat3_value": 50, "stat3_label": 50,
    "founder1_name": 200, "founder2_name": 200,

    "contact_eyebrow": 100, "contact_heading_line1": 100, "contact_heading_line2": 100,
    "contact_lede": 400, "contact_cta_email_label": 50, "contact_cta_follow_label": 50,

    "footer_text": 200,
}

# Whitelist of SiteSettings image columns editable inline -> filename prefix to use.
INLINE_IMAGE_FIELDS = {
    "logo_image": "logo",
    "services_image": "services",
    "founder1_image": "founder1",
    "founder2_image": "founder2",
}

class SiteSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    events_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    ticket_url = db.Column(db.String(500), default="", nullable=False)

    email = db.Column(db.String(200), default="getpluggednj@gmail.com", nullable=False)
    phone = db.Column(db.String(50), default="", nullable=False)
    instagram_url = db.Column(db.String(500), default="https://www.instagram.com/getpluggednj/", nullable=False)
    twitter_url = db.Column(db.String(500), default="https://twitter.com/getpluggednj", nullable=False)
    tiktok_url = db.Column(db.String(500), default="https://www.tiktok.com/@getpluggednj", nullable=False)

    # ---- Navigation ----
    nav_label_mission = db.Column(db.String(50), default="Mission", nullable=False)
    nav_label_services = db.Column(db.String(50), default="Services", nullable=False)
    nav_label_gallery = db.Column(db.String(50), default="Gallery", nullable=False)
    nav_label_stay_plugged = db.Column(db.String(50), default="Stay Plugged In", nullable=False)
    nav_label_our_story = db.Column(db.String(50), default="Our Story", nullable=False)
    nav_label_contact = db.Column(db.String(50), default="Contact", nullable=False)
    nav_cta_label = db.Column(db.String(50), default="Get Plugged", nullable=False)
    logo_image = db.Column(db.String(500), default="", nullable=False)  # empty = use default static logo

    # ---- Hero ----
    hero_eyebrow = db.Column(db.String(200), default="Creativity • Connection • Access", nullable=False)
    hero_headline = db.Column(db.String(100), default="Get Plugged", nullable=False)
    hero_subhead = db.Column(db.String(300), default="Where momentum meets opportunity.", nullable=False)
    hero_cta_primary_label = db.Column(db.String(50), default="Get Plugged", nullable=False)
    hero_cta_secondary_label = db.Column(db.String(50), default="Stay Plugged In", nullable=False)

    # ---- Mission ----
    mission_eyebrow = db.Column(db.String(100), default="Our Mission", nullable=False)
    mission_statement = db.Column(db.Text, default="Get Plugged exists to bridge the gap between potential and access. We connect emerging artists, creators, and local brands with the people, resources, and opportunities they need to reach their next level.", nullable=False)

    # ---- Services ----
    services_eyebrow = db.Column(db.String(100), default="What We Do", nullable=False)
    services_heading = db.Column(db.String(200), default="Services & Experiences", nullable=False)
    services_image = db.Column(db.String(500), default="", nullable=False)  # empty = show placeholder

    service1_title = db.Column(db.String(200), default="Events & Experiences", nullable=False)
    service1_body = db.Column(db.Text, default="Curated events and activations that create space for connection, visibility, and opportunity.", nullable=False)
    service2_title = db.Column(db.String(200), default="Creative Connections", nullable=False)
    service2_body = db.Column(db.Text, default="Connecting artists, creators, and brands with trusted people and resources across our network.", nullable=False)
    service3_title = db.Column(db.String(200), default="Artist & Creative Support", nullable=False)
    service3_body = db.Column(db.Text, default="Helping creatives identify what they need next and connect with the right resources and opportunities.", nullable=False)
    service4_title = db.Column(db.String(200), default="Partnerships & Collaborations", nullable=False)
    service4_body = db.Column(db.Text, default="Creating thoughtful connections between creatives, brands, businesses, venues, and organizations.", nullable=False)

    # ---- Gallery preview ----
    gallery_eyebrow = db.Column(db.String(100), default="Our Work", nullable=False)
    gallery_heading = db.Column(db.String(200), default="Gallery", nullable=False)
    gallery_note = db.Column(db.String(300), default="Hover to preview. Click any experience to explore the full recap.", nullable=False)

    # ---- Stay Plugged In (drives the section chrome; coming_soon_* below drive the no-event row) ----
    stay_plugged_eyebrow = db.Column(db.String(100), default="What's Next", nullable=False)
    stay_plugged_heading = db.Column(db.String(200), default="Stay Plugged In", nullable=False)
    stay_plugged_lede = db.Column(db.String(300), default="Events, collaborations, content drops, community opportunities — follow along.", nullable=False)
    stay_plugged_footer_text = db.Column(db.String(200), default="Get notified about future drops", nullable=False)

    # Drives the "Stay Plugged In" row when no event is confirmed
    coming_soon_title = db.Column(db.String(200), default="More on the way", nullable=False)
    coming_soon_body = db.Column(db.Text, default="We're lining up our next event, collab, or drop. Follow along so you don't miss it.", nullable=False)

    # ---- Our Story ----
    our_story_eyebrow = db.Column(db.String(100), default="Our Story", nullable=False)

    # Drives the "Our Story" section heading + blurb (paired with founder cards below)
    what_is_title = db.Column(db.String(200), default="Born In NJ, Made To Connect.", nullable=False)
    what_is_body = db.Column(db.Text, default=(
        "Get Plugged was founded by Jordan Scott-Young and MCP, two lifelong music lovers whose connection to the industry started before they ever met.\n\n"
        "Jordan and MCP both developed a connection to music from an early age, with Jordan immersed in singing and performance and MCP in production and engineering.\n\n"
        "Together, they discovered a shared love for marketing, bringing ideas to life and creating the kinds of spaces and opportunities that can give emerging talent an early point of access into creative and professional spaces. By combining their different skills and perspectives, they began producing events from the ground up and creating opportunities for artists, creators and local brands to connect in ways that felt genuine.\n\n"
        "What started with live music events has grown into a larger vision for Get Plugged. Today we create access, experiences and connections that help emerging talent and brands build momentum, expand their network and move toward what comes next."
    ), nullable=False)

    stat1_value = db.Column(db.String(50), default="2024", nullable=False)
    stat1_label = db.Column(db.String(50), default="Founded", nullable=False)
    stat2_value = db.Column(db.String(50), default="NJ", nullable=False)
    stat2_label = db.Column(db.String(50), default="Based", nullable=False)
    stat3_value = db.Column(db.String(50), default="Independent", nullable=False)
    stat3_label = db.Column(db.String(50), default="Built", nullable=False)

    # NEW: Team images + names
    founder1_name = db.Column(db.String(200), default="Jordan Scott-Young", nullable=False)
    founder1_image = db.Column(db.String(500), default="", nullable=False)  # uploaded file path or URL

    founder2_name = db.Column(db.String(200), default="Michael Christie", nullable=False)
    founder2_image = db.Column(db.String(500), default="", nullable=False)

    # ---- Contact ----
    contact_eyebrow = db.Column(db.String(100), default="Connect", nullable=False)
    contact_heading_line1 = db.Column(db.String(100), default="Ready to Get", nullable=False)
    contact_heading_line2 = db.Column(db.String(100), default="Plugged In?", nullable=False)
    contact_lede = db.Column(db.String(400), default="Whether you're an artist looking for access, a brand seeking authentic reach, or a venue wanting to be part of the ecosystem — we want to hear from you.", nullable=False)
    contact_cta_email_label = db.Column(db.String(50), default="Email Us", nullable=False)
    contact_cta_follow_label = db.Column(db.String(50), default="Follow @getpluggednj", nullable=False)

    # ---- Footer ----
    footer_text = db.Column(db.String(200), default="Get Plugged NJ. All rights reserved.", nullable=False)

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # keep username, but use it as an email/login identifier
    username = db.Column(db.String(80), unique=True, nullable=False)

    password_hash = db.Column(db.String(255), nullable=False)

    # NEW
    role = db.Column(db.String(20), nullable=False, default="user")  # user|admin|super_admin

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def is_admin(self) -> bool:
        return self.role in ("admin", "super_admin")

    def is_super_admin(self) -> bool:
        return self.role == "super_admin"
    
class Artist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(200), nullable=False)
    instagram_handle = db.Column(db.String(200), default="", nullable=False)  # store without @, e.g. "getpluggednj"

    def ig_url(self):
        handle = self.instagram_handle.lstrip("@").strip()
        return f"https://instagram.com/{handle}" if handle else ""
    
event_artists = db.Table(
    "event_artists",
    db.Column("event_id", db.Integer, db.ForeignKey("event.id"), primary_key=True),
    db.Column("artist_id", db.Integer, db.ForeignKey("artist.id"), primary_key=True),
)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(200), default="", nullable=False)

    artists = db.relationship("Artist", secondary=event_artists, backref="events")
    media_items = db.relationship("Media", backref="event", cascade="all, delete-orphan")

class Media(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)

    # "photo" or "video"
    media_type = db.Column(db.String(20), nullable=False)

    # simplest for now: URL to the media
    url = db.Column(db.String(500), nullable=False)

    # optional caption
    caption = db.Column(db.String(200), default="", nullable=False)

class StayPluggedRow(db.Model):
    """A row in the home page's "Stay Plugged In" list - admin-managed,
    independent of the Gallery's Event model since these are forward-looking
    promotional entries (events, collabs, announcements) and their date is
    often not a real calendar date yet (e.g. "Coming Soon")."""
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(100), default="Announcement", nullable=False)
    title = db.Column(db.String(200), default="New Update", nullable=False)
    detail = db.Column(db.String(300), default="", nullable=False)
    date_text = db.Column(db.String(100), default="", nullable=False)
    status = db.Column(db.String(100), default="Coming Soon", nullable=False)

def get_settings() -> SiteSettings:
    settings = SiteSettings.query.first()
    if not settings:
        settings = SiteSettings()
        db.session.add(settings)
        db.session.commit()
    return settings

with app.app_context():
    db.create_all()
    get_settings()

login_manager = LoginManager()
login_manager.login_view = "login"   # route name
login_manager.login_message_category = "warning"

login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

EVENTS_CONFIRMED = False # Set to False if no confirmed events

def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for("login", next=request.path))
        if not current_user.is_admin():
            flash("You do not have permission to access admin pages.", "danger")
            return redirect(url_for("home"))
        return f(*args, **kwargs)
    return wrapper

def super_admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for("login", next=request.path))
        if not current_user.is_super_admin():
            flash("Super Admin access required.", "danger")
            return redirect(url_for("admin_home"))
        return f(*args, **kwargs)
    return wrapper

upcoming_events = [
    {
        'title': 'Upcoming Confirmed Sample Event 1',
        'date': 'Date: xxxx - xx - xx',
        'location': 'Sample Location 1',
    },
]

artists = [
            {'name': 'Barti', 'social_media': {'instagram': '@chaevscarti'}},
            {'name': 'Brandin Tyrik', 'social_media': {'instagram': '@brandintyrik'}},
            {'name': 'Drew Heart', 'social_media': {'instagram': '@drewheartofficial'}},
            {'name': 'Drizzy A', 'social_media': {'instagram': '@drizzya._'}},
            {'name': 'Meexhy', 'social_media': {'instagram': '@meexhy_munyun'}},
            {'name': 'Nuwell', 'social_media': {'instagram': '@nuwell.official'}},
            {'name': 'Jus Montana', 'social_media': {'instagram': '@jusmontanaa'}},
            {'name': 'DStxckz', 'social_media': {'instagram': '@dstxckz1'}},
            {'name': 'K On Go', 'social_media': {'instagram': '@kiemo.ongo'}},
            {'name': 'Trav2x', 'social_media': {'instagram': '@trav2x_'}},
            {'name': 'The Only Notion', 'social_media': {'instagram': '@theonlynotion_'}},
            {'name': '$K Dinero', 'social_media': {'instagram': '@freetwiz'}},
            {'name': 'Maestroo J', 'social_media': {'instagram': '@maestroosoundz'}},
            {'name': 'Tr1pt', 'social_media': {'instagram': '@tr1pt973'}},
            {'name': 'Ryuu Richy', 'social_media': {'instagram': '@ryuurichy'}},
            {'name': 'Dify', 'social_media': {'instagram': '@dify_music'}},
            {'name': 'SheLuvsTJ', 'social_media': {'instagram': '@wheresclubtj'}},
            {'name': 'Sage Solaris', 'social_media': {'instagram': '@iamsagesolaris'}},
            {'name': 'Mehre', 'social_media': {'instagram': '@davinciimehre'}},
            {'name': 'Casanova Red', 'social_media': {'instagram': '@therealcasanovared'}},
            {'name': 'Stretch Dakillah', 'social_media': {'instagram': '@stretch_dakillah'}},
            {'name': 'Jayy Balla', 'social_media': {'instagram': '@jayyballa973'}},
            {'name': 'Rastafaro', 'social_media': {'instagram': '@imrastafaro'}}
]


@app.context_processor
def inject_globals():
    return dict(events_confirmed=EVENTS_CONFIRMED, current_year=datetime.now().year)

@app.context_processor
def inject_settings():
    return {"site_settings": get_settings()}

@app.template_global()
def site_image(value, fallback=None):
    """Resolve a stored image value (empty / full URL / uploaded static path) to a src URL."""
    value = (value or "").strip()
    if not value:
        return url_for("static", filename=fallback) if fallback else ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return url_for("static", filename=value.removeprefix("/static/").lstrip("/"))

@app.route('/')
def home():
    """Home page route"""
    settings = get_settings()
    next_event = upcoming_events[0] if upcoming_events else None

    # Small "Gallery" preview: most recent events, each with one cover photo if available
    gallery_preview = []
    for ev in Event.query.order_by(Event.date.desc()).limit(4).all():
        cover = Media.query.filter_by(event_id=ev.id, media_type="photo").order_by(Media.id.desc()).first()
        gallery_preview.append({"event": ev, "cover": cover})

    # "Stay Plugged In" rows. The original Tickets-toggle-driven row (fixed,
    # not admin-removable for now) comes first when confirmed, followed by
    # any rows added via Edit Mode (removable). When there's neither, the
    # section falls back to the Settings-configured coming-soon message.
    stay_plugged_rows = []
    if settings.events_confirmed and next_event:
        stay_plugged_rows.append({
            "removable": False,
            "label": "Upcoming Event",
            "title": next_event["title"],
            "detail": next_event["location"],
            "date_text": next_event["date"],
            "status": "Get Tickets" if settings.ticket_url else "More Info Soon",
        })

    for row in StayPluggedRow.query.order_by(StayPluggedRow.id.asc()).all():
        stay_plugged_rows.append({
            "removable": True,
            "id": row.id,
            "label": row.label,
            "title": row.title,
            "detail": row.detail,
            "date_text": row.date_text,
            "status": row.status,
        })

    return render_template(
        'home.html',
        gallery_preview=gallery_preview,
        stay_plugged_rows=stay_plugged_rows,
    )

@app.route("/previous")
def previous():
    # dropdown list
    events = Event.query.order_by(Event.date.desc()).all()

    selected = request.args.get("event", "all")

    if selected == "all":
        # All events view
        all_artists = (
            Artist.query
            .join(event_artists, Artist.id == event_artists.c.artist_id)
            .distinct()
            .order_by(Artist.display_name.asc())
            .all()
        )
        photos = Media.query.filter_by(media_type="photo").order_by(Media.id.desc()).all()
        videos = Media.query.filter_by(media_type="video").order_by(Media.id.desc()).all()
        selected_event = None
    else:
        # Specific event view
        selected_event = Event.query.get_or_404(int(selected))
        all_artists = (
            Artist.query
            .join(event_artists, Artist.id == event_artists.c.artist_id)
            .filter(event_artists.c.event_id == selected_event.id)
            .order_by(Artist.display_name.asc())
            .all()
        )
        photos = Media.query.filter_by(event_id=selected_event.id, media_type="photo").order_by(Media.id.desc()).all()
        videos = Media.query.filter_by(event_id=selected_event.id, media_type="video").order_by(Media.id.desc()).all()

    return render_template(
        "previous.html",
        events=events,
        selected_event=selected_event,
        selected_event_key=selected,
        all_artists=all_artists,
        photos=photos,
        videos=videos,
    )

@app.route("/gallery/<int:event_id>")
def event_detail(event_id):
    event = Event.query.get_or_404(event_id)

    artists = (
        Artist.query
        .join(event_artists, Artist.id == event_artists.c.artist_id)
        .filter(event_artists.c.event_id == event.id)
        .order_by(Artist.display_name.asc())
        .all()
    )
    photos = Media.query.filter_by(event_id=event.id, media_type="photo").order_by(Media.id.desc()).all()
    videos = Media.query.filter_by(event_id=event.id, media_type="video").order_by(Media.id.desc()).all()
    cover = photos[0] if photos else None

    return render_template(
        "event_detail.html",
        event=event,
        artists=artists,
        photos=photos,
        videos=videos,
        cover=cover,
    )

@app.route("/admin/inline-add-event", methods=["POST"])
@admin_required
def admin_inline_add_event():
    """Create a blank template event and send the admin straight to its page to fill in."""
    event = Event(title="New Event", date=datetime.now().date(), location="")
    db.session.add(event)
    db.session.commit()
    return jsonify({"ok": True, "redirect": url_for("event_detail", event_id=event.id)})

@app.route("/admin/inline-delete-event", methods=["POST"])
@admin_required
def admin_inline_delete_event():
    """Remove an event from the Gallery (e.g. added by mistake, or it's passed)."""
    data = request.get_json(silent=True) or {}
    event = Event.query.get(data.get("event_id"))
    if not event:
        return jsonify({"ok": False, "error": "Event not found."}), 404

    db.session.delete(event)
    db.session.commit()
    return jsonify({"ok": True, "redirect": url_for("home") + "#gallery-preview"})

# Event fields editable in place on /gallery/<id>: max length (strings) or "date".
EVENT_INLINE_FIELDS = {"title": 200, "location": 200, "date": "date"}

@app.route("/admin/inline-edit-event", methods=["POST"])
@admin_required
def admin_inline_edit_event():
    """Save a single Event field, edited in place on its own page."""
    data = request.get_json(silent=True) or {}
    event_id = data.get("event_id")
    field = data.get("field")
    value = data.get("value")

    if field not in EVENT_INLINE_FIELDS:
        return jsonify({"ok": False, "error": "Unknown field."}), 400
    if not isinstance(value, str):
        return jsonify({"ok": False, "error": "Invalid value."}), 400

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"ok": False, "error": "Event not found."}), 404

    value = value.strip()

    if field == "date":
        try:
            parsed = datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"ok": False, "error": "Please pick a valid date."}), 400
        event.date = parsed
        display_value = parsed.strftime("%b %d, %Y")
    else:
        if field == "title" and not value:
            return jsonify({"ok": False, "error": "Title can't be empty."}), 400
        max_len = EVENT_INLINE_FIELDS[field]
        if len(value) > max_len:
            return jsonify({"ok": False, "error": f"Too long (max {max_len} characters)."}), 400
        setattr(event, field, value)
        display_value = value or "Add location"

    db.session.commit()
    return jsonify({"ok": True, "value": display_value, "raw_value": value})

@app.route("/admin/inline-add-stay-plugged-row", methods=["POST"])
@admin_required
def admin_inline_add_stay_plugged_row():
    """Add a blank template row to the "Stay Plugged In" list."""
    row = StayPluggedRow()
    db.session.add(row)
    db.session.commit()
    return jsonify({"ok": True, "redirect": url_for("home") + "#stay-plugged-in"})

@app.route("/admin/inline-delete-stay-plugged-row", methods=["POST"])
@admin_required
def admin_inline_delete_stay_plugged_row():
    """Remove a row from the "Stay Plugged In" list."""
    data = request.get_json(silent=True) or {}
    row = StayPluggedRow.query.get(data.get("row_id"))
    if not row:
        return jsonify({"ok": False, "error": "Row not found."}), 404

    db.session.delete(row)
    db.session.commit()
    return jsonify({"ok": True, "redirect": url_for("home") + "#stay-plugged-in"})

# StayPluggedRow fields editable in place: max length for each.
STAY_PLUGGED_ROW_FIELDS = {"label": 100, "title": 200, "detail": 300, "date_text": 100, "status": 100}

@app.route("/admin/inline-edit-stay-plugged-row", methods=["POST"])
@admin_required
def admin_inline_edit_stay_plugged_row():
    """Save a single "Stay Plugged In" row field, edited in place on the home page."""
    data = request.get_json(silent=True) or {}
    field = data.get("field")
    value = data.get("value")

    if field not in STAY_PLUGGED_ROW_FIELDS:
        return jsonify({"ok": False, "error": "Unknown field."}), 400
    if not isinstance(value, str):
        return jsonify({"ok": False, "error": "Invalid value."}), 400

    row = StayPluggedRow.query.get(data.get("row_id"))
    if not row:
        return jsonify({"ok": False, "error": "Row not found."}), 404

    value = value.strip()
    if field == "title" and not value:
        return jsonify({"ok": False, "error": "Title can't be empty."}), 400

    max_len = STAY_PLUGGED_ROW_FIELDS[field]
    if len(value) > max_len:
        return jsonify({"ok": False, "error": f"Too long (max {max_len} characters)."}), 400

    setattr(row, field, value)
    db.session.commit()

    placeholders = {"detail": "Add detail", "date_text": "Add date"}
    display_value = value or placeholders.get(field, value)
    return jsonify({"ok": True, "value": display_value})

@app.route("/admin/settings", methods=["GET", "POST"])
@admin_required
def admin_settings():
    settings = get_settings()  # your helper that guarantees 1 row exists
    form = SiteSettingsForm(obj=settings)  # pre-fill form from DB row

    if form.validate_on_submit():
        settings.events_confirmed = form.events_confirmed.data

        # Only update ticket_url if user typed something.
        new_url = (form.ticket_url.data or "").strip()
        if new_url:
            settings.ticket_url = new_url
        # else: keep existing settings.ticket_url unchanged

        settings.email = (form.email.data or "").strip()
        settings.phone = (form.phone.data or "").strip()
        settings.instagram_url = (form.instagram_url.data or "").strip()
        settings.twitter_url = (form.twitter_url.data or "").strip()
        settings.tiktok_url = (form.tiktok_url.data or "").strip()

        settings.coming_soon_title = (form.coming_soon_title.data or "").strip()
        settings.coming_soon_body = (form.coming_soon_body.data or "").strip()

        settings.what_is_body = (form.what_is_body.data or "").strip()

        db.session.commit()

        flash("Settings Saved!", "success")
        return redirect(url_for("admin_settings"))

    return render_template("admin/settings.html", form=form, settings=settings)

@app.route("/admin/inline-edit", methods=["POST"])
@admin_required
def admin_inline_edit():
    """Save a single SiteSettings text field, edited in place on the live page."""
    data = request.get_json(silent=True) or {}
    field = data.get("field")
    value = data.get("value")

    if field not in INLINE_TEXT_FIELDS:
        return jsonify({"ok": False, "error": "Unknown field."}), 400
    if not isinstance(value, str):
        return jsonify({"ok": False, "error": "Invalid value."}), 400

    value = value.strip()
    max_len = INLINE_TEXT_FIELDS[field]
    if len(value) > max_len:
        return jsonify({"ok": False, "error": f"Too long (max {max_len} characters)."}), 400

    settings = get_settings()
    setattr(settings, field, value)
    db.session.commit()

    return jsonify({"ok": True, "value": value})

@app.route("/admin/inline-edit-image", methods=["POST"])
@admin_required
def admin_inline_edit_image():
    """Save a single SiteSettings image field, edited in place on the live page."""
    field = request.form.get("field")
    if field not in INLINE_IMAGE_FIELDS:
        return jsonify({"ok": False, "error": "Unknown field."}), 400

    file_storage = request.files.get("file")
    path = save_uploaded_image(file_storage, INLINE_IMAGE_FIELDS[field])
    if not path:
        return jsonify({"ok": False, "error": "Please choose an image file (png, jpg, gif, or webp)."}), 400

    settings = get_settings()
    setattr(settings, field, path)
    db.session.commit()

    return jsonify({"ok": True, "url": site_image(path)})

@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        print("LOGIN SUBMIT OK:", form.username.data)  # debug
        user = User.query.filter_by(username=form.username.data.strip()).first()
        print("USER FOUND:", bool(user), "ROLE:", getattr(user, "role", None))  # debug
        if user:
            print("PW CHECK:", user.check_password(form.password.data))  # debug

        if user and user.check_password(form.password.data):
            # Only admin/super_admin can log in
            if not user.is_admin():
                flash("Your account does not have admin access.", "danger")
                return redirect(url_for("login"))

            login_user(user)
            next_url = request.args.get("next")
            return redirect(next_url or url_for("admin_home"))
        
        flash("Invalid username or password.", "danger")
    else:
        if request.method == "POST":
            print("FORM ERRORS:", form.errors)  # debug
            flash("Form invalid (see console).", "danger")

    return render_template("login.html", form=form)

@app.route("/admin")
@admin_required
def admin_home():
    total_artists = Artist.query.count()
    total_events = Event.query.count()

    settings = get_settings()
    return render_template(
        "admin/home.html",
        total_artists=total_artists,
        total_events=total_events,
        settings=settings
    )

@app.route("/admin/artists")
@login_required
def admin_artists():
    artists = Artist.query.order_by(Artist.display_name.asc()).all()
    return render_template("admin/artists.html", artists=artists)

@app.route("/admin/artists/new", methods=["GET", "POST"])
@login_required
def admin_artists_new():
    form = ArtistForm()
    if form.validate_on_submit():
        artist = Artist(
            display_name=form.display_name.data.strip(),
            instagram_handle=form.instagram_handle.data.strip().lstrip("@"),
        )
        db.session.add(artist)
        db.session.commit()
        flash("Artist added.", "success")
        return redirect(url_for("admin_artists"))
    return render_template("admin/artist_form.html", form=form, mode="new")

@app.route("/admin/artists/<int:artist_id>/edit", methods=["GET", "POST"])
@login_required
def admin_artists_edit(artist_id):
    artist = Artist.query.get_or_404(artist_id)
    form = ArtistForm(obj=artist)

    if form.validate_on_submit():
        artist.display_name = form.display_name.data.strip()
        artist.instagram_handle = form.instagram_handle.data.strip().lstrip("@")
        db.session.commit()
        flash("Artist updated.", "success")
        return redirect(url_for("admin_artists"))

    return render_template("admin/artist_form.html", form=form, mode="edit", artist=artist)

@app.route("/admin/artists/<int:artist_id>/delete", methods=["POST"])
@login_required
def admin_artists_delete(artist_id):
    artist = Artist.query.get_or_404(artist_id)
    db.session.delete(artist)
    db.session.commit()
    flash("Artist deleted.", "warning")
    return redirect(url_for("admin_artists"))

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out.", "success")
    return redirect(url_for("home"))

@app.route("/admin/events")
@login_required
def admin_events():
    events = Event.query.order_by(Event.date.desc()).all()
    return render_template("admin/events.html", events=events)

@app.route("/admin/events/new", methods=["GET", "POST"])
@login_required
def admin_events_new():
    form = EventForm()
    if form.validate_on_submit():
        event = Event(
            title=form.title.data.strip(),
            date=form.date.data,
            location=(form.location.data or "").strip(),
        )
        db.session.add(event)
        db.session.commit()
        flash("Event created.", "success")
        return redirect(url_for("admin_events"))
    return render_template("admin/event_form.html", form=form, mode="new")

@app.route("/admin/events/<int:event_id>/edit", methods=["GET", "POST"])
@login_required
def admin_events_edit(event_id):
    event = Event.query.get_or_404(event_id)
    form = EventForm(obj=event)

    if form.validate_on_submit():
        event.title = form.title.data.strip()
        event.date = form.date.data
        event.location = (form.location.data or "").strip()
        db.session.commit()
        flash("Event updated.", "success")
        return redirect(url_for("admin_events"))

    return render_template("admin/event_form.html", form=form, mode="edit", event=event)

@app.route("/admin/events/<int:event_id>/delete", methods=["POST"])
@login_required
def admin_events_delete(event_id):
    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    flash("Event deleted.", "warning")
    return redirect(url_for("admin_events"))

@app.route("/admin/events/<int:event_id>/artists", methods=["GET", "POST"])
@login_required
def admin_event_artists(event_id):
    event = Event.query.get_or_404(event_id)
    artists = Artist.query.order_by(Artist.display_name.asc()).all()

    if request.method == "POST":
        selected_ids = request.form.getlist("artist_ids")  # list of strings
        selected_ids = [int(x) for x in selected_ids]

        selected_artists = Artist.query.filter(Artist.id.in_(selected_ids)).all()
        event.artists = selected_artists
        db.session.commit()

        flash("Event artists updated.", "success")
        return redirect(url_for("admin_events"))

    return render_template("admin/event_artists.html", event=event, artists=artists)

@app.route("/admin/events/<int:event_id>/media", methods=["GET", "POST"])
@login_required
def admin_event_media(event_id):
    event = Event.query.get_or_404(event_id)

    form = MediaForm()
    if form.validate_on_submit():
        item = Media(
            event_id=event.id,
            media_type=form.media_type.data,
            url=form.url.data.strip(),
            caption=(form.caption.data or "").strip(),
        )
        db.session.add(item)
        db.session.commit()
        flash("Media added.", "success")
        return redirect(url_for("admin_event_media", event_id=event.id))

    photos = Media.query.filter_by(event_id=event.id, media_type="photo").order_by(Media.id.desc()).all()
    videos = Media.query.filter_by(event_id=event.id, media_type="video").order_by(Media.id.desc()).all()

    return render_template(
        "admin/event_media.html",
        event=event,
        form=form,
        photos=photos,
        videos=videos,
    )


@app.route("/admin/media/<int:media_id>/delete", methods=["POST"])
@login_required
def admin_media_delete(media_id):
    item = Media.query.get_or_404(media_id)
    event_id = item.event_id
    db.session.delete(item)
    db.session.commit()
    flash("Media deleted.", "warning")
    return redirect(url_for("admin_event_media", event_id=event_id))

@app.route("/admin/users", methods=["GET", "POST"])
@admin_required   # <-- allow admin + super_admin
def admin_users():
    users = User.query.order_by(User.username.asc()).all()

    if request.method == "POST":
        action = (request.form.get("action") or "").strip()

        allowed_roles = {"admin", "super_admin"}

        # -------------------------
        # ACTION: CREATE USER
        # -------------------------
        if action == "create_user":
            if not current_user.is_super_admin():
                abort(403)

            username = (request.form.get("username") or "").strip()
            password = (request.form.get("password") or "").strip()
            role = (request.form.get("role") or "").strip()

            if not username or not password:
                flash("Username and password are required.", "danger")
                return redirect(url_for("admin_users", add=1))

            if role not in allowed_roles:
                flash("Invalid role selection.", "danger")
                return redirect(url_for("admin_users", add=1))

            # Username must be unique
            if User.query.filter_by(username=username).first():
                flash("That username is already in use.", "danger")
                return redirect(url_for("admin_users", add=1))

            # Create user
            new_user = User(username=username, role=role)
            new_user.set_password(password)

            db.session.add(new_user)
            db.session.commit()

            flash("New user created.", "success")
            return redirect(url_for("admin_users"))

        # -------------------------
        # ACTION: UPDATE ROLE (super_admin ONLY, never self)
        # -------------------------
        if action == "update_role":
            if not current_user.is_super_admin():
                abort(403)

            user_id_raw = (request.form.get("user_id") or "").strip()
            new_role = (request.form.get("role") or "").strip()

            if not user_id_raw.isdigit():
                flash("Invalid user id.", "danger")
                return redirect(url_for("admin_users"))

            if new_role not in allowed_roles:
                flash("Invalid role selection.", "danger")
                return redirect(url_for("admin_users"))

            u = User.query.get_or_404(int(user_id_raw))

            # Hard rule: never allow changing your own role
            if u.id == current_user.id:
                flash("You cannot change your own role.", "danger")
                return redirect(url_for("admin_users"))

            u.role = new_role
            db.session.commit()
            flash("Role updated.", "success")
            return redirect(url_for("admin_users"))

        # -------------------------
        # ACTION: CHANGE PASSWORD (admins + super_admin, SELF ONLY)
        # -------------------------
        if action == "change_password":
            user_id_raw = (request.form.get("user_id") or "").strip()
            current_pw = (request.form.get("current_password") or "").strip()
            new_pw = (request.form.get("new_password") or "").strip()
            confirm_pw = (request.form.get("confirm_password") or "").strip()

            if not user_id_raw.isdigit():
                flash("Invalid user id.", "danger")
                return redirect(url_for("admin_users"))

            target_id = int(user_id_raw)

            # Hard rule: can only change YOUR OWN password
            if target_id != current_user.id:
                abort(403)

            if not current_pw or not new_pw or not confirm_pw:
                flash("Please fill out all password fields.", "danger")
                return redirect(url_for("admin_users"))

            if not current_user.check_password(current_pw):
                flash("Current password is incorrect.", "danger")
                return redirect(url_for("admin_users"))

            if new_pw != confirm_pw:
                flash("New passwords do not match.", "danger")
                return redirect(url_for("admin_users"))

            # Optional: basic policy
            if len(new_pw) < 8:
                flash("New password must be at least 8 characters.", "danger")
                return redirect(url_for("admin_users"))

            current_user.set_password(new_pw)
            db.session.commit()
            flash("Password updated.", "success")
            return redirect(url_for("admin_users"))

        flash("Unknown action.", "danger")
        return redirect(url_for("admin_users"))

    return render_template("admin/users.html", users=users)

@app.route("/admin/users/<int:user_id>/delete", methods=["POST"])
@super_admin_required
def admin_users_delete(user_id):
    u = User.query.get_or_404(user_id)

    # Never allow deleting yourself
    if u.id == current_user.id:
        flash("You cannot delete your own account.", "danger")
        return redirect(url_for("admin_users"))

    db.session.delete(u)
    db.session.commit()
    flash("User deleted.", "warning")
    return redirect(url_for("admin_users"))

def ensure_default_admin():
    with app.app_context():
        u = User.query.filter_by(username="admin").first()
        if not u:
            u = User(username="admin", role="super_admin")
            u.set_password(os.environ.get("ADMIN_PASSWORD", "change-me-now"))
            db.session.add(u)
            db.session.commit()

if __name__ == '__main__':
    ensure_default_admin()
    app.run(debug=True, host='0.0.0.0', port=5000)