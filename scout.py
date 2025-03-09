import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sb
from urllib.parse import urlencode

CLIENT_ID = os.environ.get('SPOTIPY_CLIENT_ID')
CLIENT_SECRET = os.environ.get('SPOTIPY_CLIENT_SECRET')
REDIRECT_URI = os.environ.get('SPOTIPY_REDIRECT_URI')

# initialize session state
if 'token_info' not in st.session_state:
    st.session_state.token_info = None

# create spotify client
def get_spotify_client(token_info):
    return spotipy.Spotify(auth=token_info['access_token'])

def show_login_page():
    st.title("scout")
    st.write("login w/ ur spotify")

    auth_manager=SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope='user-top-read user-read-private user-read-recently-played',
        cache_path=None
    )

    # check if redirected with a code
    query_params = st.query_params
    auth_code = query_params.get('code')

    if auth_code:
        try:
            token_info = auth_manager.get_access_token(
                auth_code, check_cache=False)
            st.session_state.token_info = token_info
            st.query_params.clear()  # Clear query params after use
            st.rerun()  # Rerun to switch to main page
        except Exception as e:
            st.error(f"Authentication failed: {str(e)}")
    else:
        # Generate and display login URL
        auth_url = auth_manager.get_authorize_url()
        st.markdown(f"[Login with Spotify]({auth_url})")

# main page
def show_main_page():
    sp = get_spotify_client(st.session_state.token_info)
    st.set_page_config(page_title='Scout', page_icon=':musical_note:')
    st.title('scout')
    st.write('lets see what u listening to')

    if 'show_tracks' not in st.session_state:
        st.session_state.show_tracks = False
    if 'show_genres' not in st.session_state:
        st.session_state.show_genres = False
    if 'show_recently_played' not in st.session_state:
        st.session_state.show_recently_played = False

    # Toggle buttons
    if st.button('top tracks'):
        st.session_state.show_tracks = not st.session_state.show_tracks
    if st.button('top genres'):
        st.session_state.show_genres = not st.session_state.show_genres
    if st.button('recently played'):
        st.session_state.show_recently_played = not st.session_state.show_recently_played

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
        st.subheader('top tracks')
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
        fig.patch.set_facecolor('none')
        wedges, texts, autotexts = ax.pie(genre_counts, labels=genre_counts.index, autopct='%1.1f%%',
                                        startangle=90, colors=sb.color_palette('viridis', len(genre_counts)))
        ax.axis('equal')
        ax.set_title('Top Genres')
        
        # text color to white
        for text in texts:
            text.set_color('white')
        for autotext in autotexts:
            autotext.set_color('white')

        st.subheader('top genres')
        st.pyplot(fig)

    # recently played
    if st.session_state.show_recently_played:
        recently_played = sp.current_user_recently_played(limit=50)
        track_names = [item['track']['name'] for item in recently_played['items']]
        artists = [item['track']['artists'][0]['name'] for item in recently_played['items']]
        played_at = [item['played_at'] for item in recently_played['items']]
        track_urls = [item['track']['external_urls']['spotify'] for item in recently_played['items']]
        
        # dataframe for recently played songs
        df_recently_played = pd.DataFrame({
            'track_name': [f"[{name}]({url})" for name, url in zip(track_names, track_urls)],
            'artist': artists,
            'time': played_at
        })
        df_recently_played['time'] = pd.to_datetime(df_recently_played['time'])
        df_recently_played.set_index('time', inplace=True)

        st.subheader("recently played")
        st.markdown(df_recently_played.to_html(escape=False), unsafe_allow_html=True)

if st.session_state.token_info is None:
    show_login_page()
else:
    show_main_page()

