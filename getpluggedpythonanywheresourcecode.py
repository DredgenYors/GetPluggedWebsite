from flask import Flask, render_template
from flask import request, session, redirect, url_for

import os
import json

app = Flask(__name__)

app.secret_key = 'GP_Session_Key'

# Configuration for upcoming events display
EVENTS_CONFIRMED = True # Set to False to show "coming soon" page

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
                'name':'Barti',
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

@app.route('/font-preview')
def font_preview():
    return render_template('font_preview.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)