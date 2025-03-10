import os
import requests
import urllib.parse
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask import Flask, redirect, request, jsonify, session
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)   # flask_cors
app.secret_key = '542uih24-sdfd-dfd4-3433-9213k242k4'
CLIENT_ID = '625cacae453a47b9936b6ded6f42e390'
CLIENT_SECRET = '94522f7427764dd684c5c80376c4a7b5'
REDIRECT_URI = 'http://localhost:8000/callback'
# app.secret_key = os.getenv("SECRET_KEY")
# CLIENT_ID = os.getenv("CLIENT_ID")
# CLIENT_SECRET = os.getenv("SECRET_KEY")
# REDIRECT_URI = os.getenv("REDIRECT_URI")

AUTH_URL = 'https://accounts.spotify.com/authorize'
TOKEN_URL = 'https://accounts.spotify.com/api/token'
API_BASE_URL = 'https://api.spotify.com/v1/'


@app.route('/')
def index():
    return "Welcome to scout <a href='/login'>Login with Spotify</a>"

@app.route('/login')
def login():
    scope = 'user-read-private user-read-email'

    params = {
        'client_id': CLIENT_ID,
        'response_type': 'code',
        'scope': scope,
        'redirect_uri': REDIRECT_URI,
        'show_dialog': True # omit later
    }

    auth_url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"

    # Frontend login request
    if request.headers.get('X-Requested-With') == 'XML HttpRequest':
        return jsonify({'auth_url' : auth_url})
    else:
        # direct browswer requests or backend-initiated flows
        return redirect(auth_url)


@app.route('/callback')
def callback():
    if 'error' in request.args:
        return jsonify({"error": request.args['error']})

    if 'code' in request.args:
        req_body = {
            'code': request.args['code'],
            'grant_type': 'authorization_code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }

        response = requests.post(TOKEN_URL, data=req_body) 
        token_info = response.json()
        
        session['access_token'] = token_info['access_token']
        session['refresh_token'] = token_info['refresh_token']
        session['expires_at'] = datetime.now().timestamp() + token_info['expires_in']  # seconds (one day)

        return redirect('/playlists')
    return jsonify({"error": "No code provided"}), 400
    

@app.route('/playlists')
def get_playlists():
    if 'access_token' not in session:
        return redirect('/login')
    
    if datetime.now().timestamp() > session['expires_at']:
        return redirect('/refresh-token')
    
    headers = {
        'Authorization': f"Bearer {session['access_token']}"
    }

    response = requests.get(API_BASE_URL + 'me/playlists', headers=headers)
    playlists = response.json()

    return jsonify(playlists)


@app.route('/refresh-token')
def refresh_token():
    if 'refresh_token' not in session:
        return redirect('/login')
    
    if datetime.now().timestamp() > session['expires_at']:
        req_body = {
            'grant_type': 'refresh_token',
            'refresh_token': session['refresh_token'],
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }

        response = requests.post(TOKEN_URL, data=req_body)
        new_token_info = response.json()
        
        session['access_token'] = new_token_info['access_token']
        session['expires_at'] = datetime.now().timestamp() + new_token_info['expires_in'] 

        return redirect('/playlists')


@app.route('/top-tracks')
def get_top_tracks():
    if 'access_token' not in session:
        return redirect('/login')

    if datetime.now().timestamp() > session['expires_at']:
        return redirect('/refresh-token')
    
    headers = {
        'Authorization': f"Bearer {session['access_token']}"
    }

    response = requests.get(API_BASE_URL + 'me/top/tracks', headers=headers)
    top_tracks = response.json()

    return jsonify(top_tracks)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)