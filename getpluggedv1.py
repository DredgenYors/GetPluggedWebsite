from flask import Flask, render_template, redirect, url_for, flash, request, abort
import os 
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

csrf = CSRFProtect(app)

db = SQLAlchemy(app)

class SiteSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    events_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    ticket_url = db.Column(db.String(500), default="", nullable=False)

    email = db.Column(db.String(200), default="getpluggednj@gmail.com", nullable=False)
    phone = db.Column(db.String(50), default="", nullable=False)
    instagram_url = db.Column(db.String(500), default="https://www.instagram.com/getpluggednj/", nullable=False)

    coming_soon_title = db.Column(db.String(200), default="Exciting Events Coming Soon!", nullable=False)
    coming_soon_body = db.Column(db.Text, default="We're currently planning our next amazing events and experiences.", nullable=False)

    what_is_title = db.Column(db.String(200), default="What is GPNJ?", nullable=False)
    what_is_body = db.Column(db.Text, default="", nullable=False)

    mission_statement = db.Column(db.Text, default="Connecting creatives and audiences through events that foster an intimate and uplifting environment.", nullable=False)

    # NEW: Team images + names
    founder1_name = db.Column(db.String(200), default="Jordan Scott-Young", nullable=False)
    founder1_image = db.Column(db.String(500), default="", nullable=False)  # URL or /static path

    founder2_name = db.Column(db.String(200), default="Michael Christie", nullable=False)
    founder2_image = db.Column(db.String(500), default="", nullable=False)

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
    return dict(events_confirmed=EVENTS_CONFIRMED)

@app.context_processor
def inject_settings():
    return {"site_settings": get_settings()}

@app.route('/')
def home():
    """Home page route"""
    next_event = upcoming_events[0] if upcoming_events else None
    return render_template('home.html', next_event=next_event)

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

        # NEW
        settings.coming_soon_title = (form.coming_soon_title.data or "").strip()
        settings.coming_soon_body = (form.coming_soon_body.data or "").strip()

        settings.what_is_title = (form.what_is_title.data or "").strip()
        settings.what_is_body = (form.what_is_body.data or "").strip()

        settings.mission_statement = (form.mission_statement.data or "").strip()

        settings.founder1_name = (form.founder1_name.data or "").strip()
        settings.founder1_image = (form.founder1_image.data or "").strip()
        settings.founder2_name = (form.founder2_name.data or "").strip()
        settings.founder2_image = (form.founder2_image.data or "").strip()

        db.session.commit()

        flash("Settings Saved!", "success")
        return redirect(url_for("admin_settings"))

    return render_template("admin/settings.html", form=form)

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

        allowed_roles = {"user", "admin", "super_admin"}

        # -------------------------
        # ACTION: CREATE USER
        # -------------------------
        if action == "create_user":
            if not current_user.is_super_admin():
                abort(403)

            username = (request.form.get("username") or "").strip()
            password = (request.form.get("password") or "").strip()
            role = (request.form.get("role") or "").strip()

            allowed_roles = {"user", "admin", "super_admin"}

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