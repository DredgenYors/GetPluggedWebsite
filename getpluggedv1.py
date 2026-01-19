from flask import Flask, render_template, redirect, url_for, flash, request, abort
import os 
from flask_sqlalchemy import SQLAlchemy # Access database connection, instead of writing raw SQL
from forms import SiteSettingsForm, ArtistForm, EventForm, MediaForm
from flask_login import UserMixin, LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from wtforms.validators import DataRequired

app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///getplugged.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

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

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
    
class Artist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(200), nullable=False)
    instagram_handle = db.Column(db.String(200), default="", nullable=False)  # store without @, e.g. "getpluggednj"
    active = db.Column(db.Boolean, default=True, nullable=False)

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

    # Create admin user if missing (change these!)
    if not User.query.filter_by(username="admin").first():
        u = User(username="admin")
        u.set_password(os.environ.get("ADMIN_PASSWORD", "change-me-now"))
        db.session.add(u)
        db.session.commit()

login_manager = LoginManager(app)
login_manager.login_view = "login"  # where to send people if not logged in

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

EVENTS_CONFIRMED = False # Set to False if no confirmed events

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
            .filter(Artist.active == True)
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
            .filter(Artist.active == True)
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
@login_required
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
    if current_user.is_authenticated:
        return redirect(url_for("admin_settings"))

    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for("admin_settings"))

        flash("Invalid username or password", "danger")

    return render_template("admin/login.html")

@app.route("/admin")
@login_required
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
            active=form.active.data if form.active.data is not None else True
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
        artist.active = form.active.data
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
    return redirect(url_for("login"))

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)