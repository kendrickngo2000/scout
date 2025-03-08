import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import streamlit as st
import pandas as pd

CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
REDIRECT_URI = 'http://localhost:8000/callback'

sp = spotipy.Spotify(
    auth_manager=SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope='user-top-read user-read-private'
    )
)

st.set_page_config(page_title='Scout', page_icon=':musical_note:')
st.title('scout')
st.write('lets see what u listening to')

if 'show_tracks' not in st.session_state:
    st.session_state.show_tracks = False

# Toggle buttons
if st.button('top tracks'):
    st.session_state.show_tracks = not st.session_state.show_tracks
if st.button('top genres'):
    st.session_state.show_genres = not st.session_state.show_genres

# top tracks
if st.session_state.show_tracks:
    top_tracks = sp.current_user_top_tracks(limit=10, time_range='medium_term')
    track_ids = [track['id'] for track in top_tracks['items']]

    # audio_features() from spotipy deprecated
    audio_features = sp.tracks(track_ids)['tracks']

    # dataframe with audio features?
    df = pd.DataFrame(audio_features)
    df['track_name'] = [track['name'] for track in top_tracks['items']]
    df = df[['track_name', 'popularity', 'duration_ms', 'explicit']]
    df.set_index('track_name', inplace=True)

    # display bar chart
    st.subheader('Audio Features for Top Tracks')
    st.bar_chart(df, height=500)

    # display clickable links for each song
    st.subheader('click to play')
    for track in top_tracks['items']:
        track_name = track['name']
        track_url = track['external_urls']['spotify']
        st.write(f"[{track_name}]({track_url})")

# top genres
if st.session_state.show_genres:
    top_artists = sp.current_user_top_artists(limit=10, time_range='medium_term')
    genres = [genre for artist in top_artists['items'] for genre in artist['genres']]
    genre_counts = pd.Series(genres).value_counts()
    
    # Create a pie chart of the top genres
    fig, ax = plt.subplots()
    ax.pie(genre_counts, labels=genre_counts.index,
           autopct='%1.1f%%', startangle=90)
    # Equal aspect ratio ensures that pie is drawn as a circle.
    ax.axis('equal')

    st.subheader('Top Genres')
    st.pyplot(fig)




