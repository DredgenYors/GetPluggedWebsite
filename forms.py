from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import BooleanField, StringField, PasswordField, SubmitField, DateField, SelectField, TextAreaField
from wtforms.validators import Optional, URL, DataRequired, Length

IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"]

class SiteSettingsForm(FlaskForm):
    events_confirmed = BooleanField("Event Confirmed")

    ticket_url = StringField("Ticket URL", validators=[Optional(), URL(message="Enter a valid URL")])

    email = StringField("Email", validators=[Optional()])
    phone = StringField("Phone", validators=[Optional()])
    instagram_url = StringField("Instagram", validators=[Optional(), URL(message="Enter a valid URL")])
    twitter_url = StringField("Twitter / X", validators=[Optional(), URL(message="Enter a valid URL")])
    tiktok_url = StringField("TikTok", validators=[Optional(), URL(message="Enter a valid URL")])

    # ---- Navigation ----
    nav_label_mission = StringField("Nav Label: Mission", validators=[Optional(), Length(max=50)])
    nav_label_services = StringField("Nav Label: Services", validators=[Optional(), Length(max=50)])
    nav_label_gallery = StringField("Nav Label: Gallery", validators=[Optional(), Length(max=50)])
    nav_label_stay_plugged = StringField("Nav Label: Stay Plugged In", validators=[Optional(), Length(max=50)])
    nav_label_our_story = StringField("Nav Label: Our Story", validators=[Optional(), Length(max=50)])
    nav_label_contact = StringField("Nav Label: Contact", validators=[Optional(), Length(max=50)])
    nav_cta_label = StringField("Nav Button Text", validators=[Optional(), Length(max=50)])
    logo_image = FileField("Logo Image", validators=[Optional(), FileAllowed(IMAGE_EXTENSIONS, "Images only")])

    # ---- Hero ----
    hero_eyebrow = StringField("Banner Text", validators=[Optional(), Length(max=200)])
    hero_headline = StringField("Headline", validators=[Optional(), Length(max=100)])
    hero_subhead = StringField("Subheading", validators=[Optional(), Length(max=300)])
    hero_cta_primary_label = StringField("Primary Button Text", validators=[Optional(), Length(max=50)])
    hero_cta_secondary_label = StringField("Secondary Button Text", validators=[Optional(), Length(max=50)])

    # ---- Mission ----
    mission_eyebrow = StringField("Mission Text", validators=[Optional(), Length(max=100)])
    mission_statement = TextAreaField("Mission Statement", validators=[Optional()])

    # ---- Services ----
    services_eyebrow = StringField("S & E Text", validators=[Optional(), Length(max=100)])
    services_heading = StringField("Heading", validators=[Optional(), Length(max=200)])
    services_image = FileField("Placeholder Image", validators=[Optional(), FileAllowed(IMAGE_EXTENSIONS, "Images only")])

    service1_title = StringField("Service 1 Title", validators=[Optional(), Length(max=200)])
    service1_body = TextAreaField("Service 1 Description", validators=[Optional()])
    service2_title = StringField("Service 2 Title", validators=[Optional(), Length(max=200)])
    service2_body = TextAreaField("Service 2 Description", validators=[Optional()])
    service3_title = StringField("Service 3 Title", validators=[Optional(), Length(max=200)])
    service3_body = TextAreaField("Service 3 Description", validators=[Optional()])
    service4_title = StringField("Service 4 Title", validators=[Optional(), Length(max=200)])
    service4_body = TextAreaField("Service 4 Description", validators=[Optional()])

    # ---- Gallery preview ----
    gallery_eyebrow = StringField("Gallery Text", validators=[Optional(), Length(max=100)])
    gallery_heading = StringField("Heading", validators=[Optional(), Length(max=200)])
    gallery_note = StringField("Note Text", validators=[Optional(), Length(max=300)])

    # ---- Stay Plugged In ----
    stay_plugged_eyebrow = StringField("SP Text", validators=[Optional(), Length(max=100)])
    stay_plugged_heading = StringField("Heading", validators=[Optional(), Length(max=200)])
    stay_plugged_lede = StringField("Subtext", validators=[Optional(), Length(max=300)])
    stay_plugged_footer_text = StringField("Footer Link Text", validators=[Optional(), Length(max=200)])

    coming_soon_title = StringField("'Stay Plugged In' Title (shown when no event is confirmed)", validators=[Optional(), Length(max=200)])
    coming_soon_body = TextAreaField("'Stay Plugged In' Message (shown when no event is confirmed)", validators=[Optional()])

    # ---- Our Story ----
    our_story_eyebrow = StringField("Our Story Text", validators=[Optional(), Length(max=100)])
    what_is_title = StringField("'Our Story' Title", validators=[Optional(), Length(max=200)])
    what_is_body = TextAreaField("'Our Story' Blurb", validators=[Optional()])

    stat1_value = StringField("WIP 1 Value", validators=[Optional(), Length(max=50)])
    stat1_label = StringField("WIP 1 Label", validators=[Optional(), Length(max=50)])
    stat2_value = StringField("WIP 2 Value", validators=[Optional(), Length(max=50)])
    stat2_label = StringField("WIP 2 Label", validators=[Optional(), Length(max=50)])
    stat3_value = StringField("WIP 3 Value", validators=[Optional(), Length(max=50)])
    stat3_label = StringField("WIP 3 Label", validators=[Optional(), Length(max=50)])

    founder1_name = StringField("Name", validators=[Optional(), Length(max=200)])
    founder1_image = FileField("Photo", validators=[Optional(), FileAllowed(IMAGE_EXTENSIONS, "Images only")])

    founder2_name = StringField("Name", validators=[Optional(), Length(max=200)])
    founder2_image = FileField("Photo", validators=[Optional(), FileAllowed(IMAGE_EXTENSIONS, "Images only")])

    # ---- Contact ----
    contact_eyebrow = StringField("Connect Text", validators=[Optional(), Length(max=100)])
    contact_heading_line1 = StringField("Heading Line 1", validators=[Optional(), Length(max=100)])
    contact_heading_line2 = StringField("Heading Line 2 (accent color)", validators=[Optional(), Length(max=100)])
    contact_lede = StringField("Subtext", validators=[Optional(), Length(max=400)])
    contact_cta_email_label = StringField("Email Button Text", validators=[Optional(), Length(max=50)])
    contact_cta_follow_label = StringField("Follow Button Text", validators=[Optional(), Length(max=50)])

    # ---- Footer ----
    footer_text = StringField("Footer Text (year is added automatically)", validators=[Optional(), Length(max=200)])

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
