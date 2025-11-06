from flask import Flask, render_template
from datetime import datetime
from flask_mail import Mail, Message
from flask import request, session, redirect, url_for

import os
import json

app = Flask(__name__)

EVENTS_CONFIRMED = True # Set to False if no confirmed events

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
        'artists': [
            {
                'name': 'Barti',
                'social_media': {'instagram': '@chaevscarti'}
            },
            {
                'name': 'Brandin Tyrik',
                'social_media': {'instagram': '@brandintyrik'}
            },
            {
                'name': 'Drew Heart',
                'social_media': {'instagram': '@drewheartofficial'}
            },
            {
                'name': 'Drizzy A',
                'social_media': {'instagram': '@drizzya._'}
            },
            {
                'name': 'Meexhy',
                'social_media': {'instagram': '@meexhy_munyun'}
            },
            {
                'name': 'Nuwell',
                'social_media': {'instagram': '@nuwell.official'}
            },
            {
                'name': 'Jus Montana',
                'social_media': {'instagram': '@jusmontanaa'}
            },
            {
                'name': 'DStxckz',
                'social_media': {'instagram': '@dstxckz1'}
            },
            {
                'name': 'K On Go',
                'social_media': {'instagram': '@kiemo.ongo'}
            },
            {
                'name': 'Trav2x',
                'social_media': {'instagram': '@trav2x_'}
            },
            {
                'name': 'The Only Notion',
                'social_media': {'instagram': '@theonlynotion_'}
            },
            {
                'name': '$K Dinero',
                'social_media': {'instagram': '@freetwiz'}
            },
            {
                'name': 'Maestroo J',
                'social_media': {'instagram': '@maestroosoundz'}
            },
            {
                'name': 'Tr1pt',
                'social_media': {'instagram': '@tr1pt973'}
            },
            {
                'name': 'Ryuu Richy',
                'social_media': {'instagram': '@ryuurichy'}
            },
            {
                'name': 'Dify',
                'social_media': {'instagram': '@dify_music'}
            },
            {
                'name': 'SheLuvsTJ',
                'social_media': {'instagram': '@wheresclubtj'}
            },
            {
                'name': 'Sage Solaris',
                'social_media': {'instagram': '@iamsagesolaris'}
            },
            {
                'name': 'Mehre',
                'social_media': {'instagram': '@davinciimehre'}
            },
            {
                'name': 'Casanova Red',
                'social_media': {'instagram': '@therealcasanovared'}
            },
            {
                'name': 'Stretch Dakillah',
                'social_media': {'instagram': '@stretch_dakillah'}
            },
            {
                'name': 'Jayy Balla',
                'social_media': {'instagram': '@jayyballa973'}
            },
            {
                'name': 'Rastafaro',
                'social_media': {'instagram': '@imrastafaro'}
            }
        ]
    },
]

@app.route('/')
def home():
    """Home page route"""
    next_event = upcoming_events[0] if upcoming_events else None
    return render_template('home.html', events_confirmed=EVENTS_CONFIRMED, next_event=next_event)

@app.route('/previous')
def previous():
    # Combine all artists from all previous events
    all_artists = []
    for event in previous_events:
        for artist in event.get('artists', []):
            # Optionally add event info to artist dict
            artist_copy = artist.copy()
            all_artists.append(artist_copy)
    return render_template(
        'previous.html',
        events=previous_events,
        events_confirmed=EVENTS_CONFIRMED,
        all_artists=all_artists
    )

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)