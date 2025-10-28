from flask import Flask, render_template
from datetime import datetime

app = Flask(__name__)

# Configuration for upcoming events display
EVENTS_CONFIRMED = True # Set to False to show "coming soon" page

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
                'name': 'Sample Artist 1',
                'genre': 'Indie Folk',
                'bio': 'Acoustic duo specializing in soulful melodies and heartfelt lyrics.',
                'social_media': {
                    'instagram': 'instagramhandle',
                    'spotify': 'spotifyhandle',
                    'website': 'sitelink'
                },
                'contact': 'booking@lunathemoonbeams.com'
            },
            {
                'name': 'Sample Artist 2',
                'genre': 'Electronic/House',
                'bio': 'High-energy electronic music producer and live DJ.',
                'social_media': {
                    'instagram': 'instagramhandle',
                    'soundcloud': 'soundcloudhandle',
                    'youtube': 'youtubelink'
                },
                'contact': 'phoenix.dj.booking@gmail.com'
            }
        ]
    },
    {
        'title': 'Sample Event 2',
        'date': 'Date: xxxx - xx - xx',
        'location': 'Sample Location 2',
        'description': 'Delicious food from various local food trucks and vendors.',
        'artists': [
            {
                'name': 'Sample Artist 1',
                'genre': 'Blues Rock',
                'bio': 'Classic blues rock with modern twists and incredible guitar solos.',
                'social_media': {
                    'instagram': 'instagramhandle',
                    'facebook': 'facebookhandle',
                    'spotify': 'spotifyhandle'
                },
                'contact': 'management@riversideband.net'
            },
            {
                'name': 'Sample Artist 2',
                'genre': 'Latin Pop',
                'bio': 'Bilingual singer-songwriter bringing Latin rhythms to modern pop.',
                'social_media': {
                    'instagram': '@sofia_martinez_music',
                    'tiktok': '@sofiamusic',
                    'spotify': 'Sofia Martinez'
                },
                'contact': 'sofia.martinez.booking@gmail.com'
            },
            {
                'name': 'Sample Artist 3',
                'genre': 'Synthwave',
                'bio': 'Retro-futuristic electronic music with nostalgic 80s vibes.',
                'social_media': {
                    'instagram': 'instagramhandle',
                    'bandcamp': 'bandcamplink',
                    'youtube': 'youtubelink'
                },
                'contact': 'electricharmonyband@outlook.com'
            }
        ]
    },
    {
        'title': 'Sample Event 3',
        'date': 'Date: xxxx - xx -xx',
        'location': 'Sample Location 3',
        'description': 'Annual charity run to support local community initiatives.',
        'artists': [
            {
                'name': 'Sample Artist 1',
                'genre': 'Folk/Acoustic',
                'bio': 'Duo performing original acoustic songs with powerful harmonies.',
                'social_media': {
                    'instagram': 'instagramhandle',
                    'spotify': 'spotifyhandle',
                    'website': 'websitelink'
                },
                'contact': 'contact@acousticsouls.music'
            },
            {
                'name': 'Sample Artist 2',
                'genre': 'Hip-Hop/Rap',
                'bio': 'Local rapper with conscious lyrics and community-focused messages.',
                'social_media': {
                    'instagram': 'instagramhandle',
                    'soundcloud': 'soundcloudhandle',
                    'twitter': 'twitterhandle'
                },
                'contact': 'mcrhythm.booking@gmail.com'
            },
            {
                'name': 'Sample Artist 3',
                'genre': 'Contemporary Jazz',
                'bio': 'Five-piece jazz ensemble bringing smooth, modern jazz to the community.',
                'social_media': {
                    'instagram': 'instagramhandle',
                    'facebook': 'facebookhandle',
                    'spotify': 'spotifyhandle'
                },
                'contact': 'booking@jazzcollectivenj.com'
            }
        ]
    }
]

@app.route('/')
def home():
    """Home page route"""
    return render_template('home.html', events_confirmed=EVENTS_CONFIRMED)

@app.route('/upcoming')
def upcoming():
    """Upcoming events page route - shows different content based on EVENTS_CONFIRMED"""
    next_event = upcoming_events[0] if upcoming_events else None
    return render_template(
        'upcoming_confirmed.html',
        events=upcoming_events,
        events_confirmed=EVENTS_CONFIRMED,
        next_event=next_event
    )

@app.route('/previous')
def previous():
    return render_template('previous.html', events=previous_events, events_confirmed=EVENTS_CONFIRMED)

@app.route('/tickets')
def tickets():
    return render_template('tickets.html', events=upcoming_events, events_confirmed=EVENTS_CONFIRMED)

@app.route('/payment')
def payment():
    return render_template('payment.html', events_confirmed=EVENTS_CONFIRMED)

@app.route('/post_payment')
def post_payment():
    return render_template('post_payment.html', events_confirmed=EVENTS_CONFIRMED)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)