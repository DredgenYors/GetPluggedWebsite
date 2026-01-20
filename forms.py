from flask_wtf import FlaskForm
from wtforms import BooleanField, StringField, SubmitField, DateField, SelectField, TextAreaField
from wtforms.validators import Optional, URL, DataRequired, Length

class SiteSettingsForm(FlaskForm):
    events_confirmed = BooleanField("Event Confirmed")

    ticket_url = StringField("Ticket URL", validators=[Optional(), URL(message="Enter a valid URL")])

    email = StringField("Email", validators=[Optional()])
    phone = StringField("Phone", validators=[Optional()])
    instagram_url = StringField("Instagram", validators=[Optional(), URL(message="Enter a valid URL")])

    coming_soon_title = StringField("'Coming Soon' Title", validators=[Optional(), Length(max=200)])
    coming_soon_body = TextAreaField("'Coming Soon' Message", validators=[Optional()])

    what_is_title = StringField("'What is GPNJ' Title", validators=[Optional(), Length(max=200)])
    what_is_body = TextAreaField("'What is GPNJ' Message", validators=[Optional()])

    mission_statement = TextAreaField("Mission Statement", validators=[Optional()])

    founder1_name = StringField("Name", validators=[Optional(), Length(max=200)])
    founder1_image = StringField("Image", validators=[Optional(), Length(max=500)])

    founder2_name = StringField("Name", validators=[Optional(), Length(max=200)])
    founder2_image = StringField("Image", validators=[Optional(), Length(max=500)])

    submit = SubmitField("Save Settings")

class ArtistForm(FlaskForm):
    display_name = StringField("Artist Name", validators=[DataRequired()])
    instagram_handle = StringField("Instagram Handle (no @)", validators=[Optional()])
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
