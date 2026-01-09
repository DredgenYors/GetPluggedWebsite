from flask import Flask, render_template

app = Flask(__name__)

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

@app.route('/')
def home():
    """Home page route"""
    next_event = upcoming_events[0] if upcoming_events else None
    return render_template('home.html', next_event=next_event)

@app.route('/previous')
def previous():
    sorted_artists = sorted(artists, key=lambda a: a.get("name", "").lower())

    return render_template(
        "previous.html",
        all_artists=sorted_artists
    )

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)