from flask_wtf import FlaskForm
from wtforms import BooleanField, StringField, PasswordField, SubmitField, DateField, SelectField, TextAreaField
from wtforms.validators import Optional, URL, DataRequired, Length

class SiteSettingsForm(FlaskForm):
    """Configuration that isn't editable on the live page itself: toggles,
    link targets, and the one field (what_is_body) that can't map to a
    single inline-editable element. Everything else (headings, copy,
    images) is edited in place via Edit Mode on the home page."""

    events_confirmed = BooleanField("Event Confirmed")
    ticket_url = StringField("Ticket URL", validators=[Optional(), URL(message="Enter a valid URL")])

    email = StringField("Email", validators=[Optional()])
    phone = StringField("Phone", validators=[Optional()])
    instagram_url = StringField("Instagram", validators=[Optional(), URL(message="Enter a valid URL")])
    twitter_url = StringField("Twitter / X", validators=[Optional(), URL(message="Enter a valid URL")])
    tiktok_url = StringField("TikTok", validators=[Optional(), URL(message="Enter a valid URL")])

    # Shown in the "Stay Plugged In" section only while no event is confirmed
    # above - kept here too since that page state isn't always on screen.
    coming_soon_title = StringField("'Stay Plugged In' Title (shown when no event is confirmed)", validators=[Optional(), Length(max=200)])
    coming_soon_body = TextAreaField("'Stay Plugged In' Message (shown when no event is confirmed)", validators=[Optional()])

    # Renders as multiple separate paragraphs on the page, so it can't be a
    # single inline-editable element.
    what_is_body = TextAreaField("'Our Story' Blurb", validators=[Optional()])

    submit = SubmitField("Save Settings")

class ArtistForm(FlaskForm):
    display_name = StringField("Name", validators=[DataRequired()])
    instagram_handle = StringField("Instagram Handle", validators=[Optional()])
    submit = SubmitField("Save Artist")

class EventForm(FlaskForm):
    title = StringField("Event Title", validators=[DataRequired()])
    date = DateField("Event Date", validators=[DataRequired()], format="%Y-%m-%d")
    location = StringField("Location", validators=[Optional()])
    submit = SubmitField("Save Event")

class MediaForm(FlaskForm):
    media_type = SelectField(
        "Type",
        choices=[("photo", "Photo"), ("video", "Video")],
        validators=[DataRequired()],
    )
    url = StringField("Media URL", validators=[DataRequired(), URL()])
    caption = StringField("Caption", validators=[Optional()])
    submit = SubmitField("Add Media")

class LoginForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Log in")
