from flask import Flask, render_template
from datetime import datetime
from flask_mail import Mail, Message
from flask import request, session, redirect, url_for

import os
import json

app = Flask(__name__)

app.secret_key = 'GP_Session_Key'

# Configuration for upcoming events display
EVENTS_CONFIRMED = True # Set to False to show "coming soon" page

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'getpluggedupdates@gmail.com'
app.config['MAIL_PASSWORD'] = 'syhl aaln fjql wuvc'  # Use an app password, not your main password

mail = Mail(app)

# Path to store subscriber emails
SUBSCRIBERS_FILE = os.path.join(os.path.dirname(__file__), 'subscribers.json')

def save_subscriber_email(email):
    """Save email to subscribers.json (no duplicates)"""
    try:
        if os.path.exists(SUBSCRIBERS_FILE):
            with open(SUBSCRIBERS_FILE, 'r') as f:
                data = json.load(f)
        else:
            data = []
        if email not in data:
            data.append(email)
            with open(SUBSCRIBERS_FILE, 'w') as f:
                json.dump(data, f)
    except Exception as e:
        print(f"Error saving subscriber: {e}")

def send_subscribe_email(email):
    """Send confirmation email to new subscriber"""
    try:
        msg = Message(
            subject="Thanks for subscribing to GetPlugged!",
            sender=app.config['MAIL_USERNAME'],
            recipients=[email],
            body="""
Thank you for subscribing to GetPlugged event updates!

You'll be the first to know about our upcoming events, ticket releases, and more.

Stay tuned!

Best,
The GetPlugged Team
"""
        )
        mail.send(msg)
    except Exception as e:
        print(f"Error sending subscribe email: {e}")

# Sample data for events
upcoming_events = [
    {
        'title': 'Upcoming Confirmed Sample Event 1',
        'date': 'Date: xxxx - xx - xx',
        'location': 'Sample Location 1',
    },
]

previous_events = [
    {
        'title': 'Sample Event 1',
        'date': 'Date: xxxx - xx - xx',
        'location': 'Sample Location 1',
        'description': 'Professional development workshops for local professionals.',
        'artists': [
            {
                'name': 'Barti',
                'genre': 'Indie Folk',
                'bio': 'Acoustic duo specializing in soulful melodies and heartfelt lyrics.',
                'social_media': {
                    'instagram': '@chaevscarti',
                },
                'contact': 'booking@lunathemoonbeams.com'
            },
            {
                'name': 'Brandin Tyrik',
                'genre': 'Electronic/House',
                'bio': 'High-energy electronic music producer and live DJ.',
                'social_media': {
                    'instagram': '@brandintyrik',
                },
                'contact': 'phoenix.dj.booking@gmail.com'
            },
            {
                'name': 'Drew Heart',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@drewheartofficial',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Drizzy A',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@drizzya._',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Meexhy',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@meexhy_munyun',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Nuwell',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@nuwell.official',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Jus Montana',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@jusmontanaa',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'DStxckz',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@dstxckz1',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'K On Go',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@kiemo.ongo',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Trav2x',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@trav2x_',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'The Only Notion',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@theonlynotion_',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': '$K Dinero',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@freetwiz',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Maestroo J',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@maestroosoundz',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Tr1pt',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@tr1pt973',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Ryuu Richy',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@ryuurichy',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Dify',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@dify_music',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'SheLuvsTJ',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@wheresclubtj',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Sage Solaris',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@iamsagesolaris',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Mehre',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@davinciimehre',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Casanova Red',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@therealcasanovared',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Stretch Dakillah',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@stretch_dakillah',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Jayy Balla',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@jayyballa973',
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Rastafaro',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': '@imrastafaro',
                },
                'contact': 'management@riversideband.net'
            }
        ]
    },
]

@app.route('/')
def home():
    """Home page route"""
    next_event = upcoming_events[0] if upcoming_events else None
    return render_template('home.html', events_confirmed=EVENTS_CONFIRMED, next_event=next_event)


# --- SUBSCRIBE ROUTE ---
@app.route('/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    if not email or '@' not in email:
        return {"success": False, "error": "Invalid email."}, 400
    save_subscriber_email(email)
    send_subscribe_email(email)
    return {"success": True}

@app.route('/upcoming')
def upcoming():
    next_event = upcoming_events[0] if upcoming_events else None
    if EVENTS_CONFIRMED:
        return render_template(
            'upcoming_confirmed.html',
            events=upcoming_events,
            events_confirmed=EVENTS_CONFIRMED,
            next_event=next_event
        )
    else:
        return render_template(
            'upcoming_coming_soon.html',
            events_confirmed=EVENTS_CONFIRMED
        )

@app.route('/previous')
def previous():
    # Combine all artists from all previous events
    all_artists = []
    for event in previous_events:
        for artist in event.get('artists', []):
            # Optionally add event info to artist dict
            artist_copy = artist.copy()
            artist_copy['event_title'] = event['title']
            artist_copy['event_date'] = event['date']
            all_artists.append(artist_copy)
    return render_template(
        'previous.html',
        events=previous_events,
        events_confirmed=EVENTS_CONFIRMED,
        all_artists=all_artists
    )

@app.route('/tickets')
def tickets():
    return render_template('tickets.html', events=upcoming_events, events_confirmed=EVENTS_CONFIRMED)

@app.route('/payment', methods=['GET', 'POST'])
def payment():
    if request.method == 'POST':
        session['user_email'] = request.form['email']
        session['user_name'] = request.form['name']
        # ...process payment...
        return redirect(url_for('post_payment'))
    return render_template('payment.html', events_confirmed=EVENTS_CONFIRMED)

@app.route('/post_payment')
def post_payment():
    user_email = session.get('user_email')
    user_name = session.get('user_name')
    order_details = 'Order summary goes here. This is a placeholder for now to test email sending logic post payment.'  # Replace with actual logic

    if user_email:
        msg = Message(
            subject="Thank You for Your Purchase!",
            sender=app.config['MAIL_USERNAME'],
            recipients=[user_email]
        )
        msg.body = f"Hi {user_name},\n\nThank you for your purchase!\n\n{order_details}\n\nWe look forward to seeing you at the event!"
        mail.send(msg)

    return render_template('post_payment.html', events_confirmed=EVENTS_CONFIRMED)

@app.route('/font-preview')
def font_preview():
    return render_template('font_preview.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)