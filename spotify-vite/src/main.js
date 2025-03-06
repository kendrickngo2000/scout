import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'


setupCounter(document.querySelector('#counter'))

async function fetchplaylists() {
  try {
    const response = await fetch('http://localhost:8000/playlists', {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    document.querySelector('#playlists').innerHTML = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error fetching playlists:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const spotifyLoginButton = document.getElementById('spotify-login');
  spotifyLoginButton.addEventListener('click', () => {
    const clientId = '625cacae453a47b9936b6ded6f42e390';
    const redirectUri = 'http://localhost:8000/callback';
    const scopes = 'user-read-private user-read-email';
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = spotifyAuthUrl;
  });

  async function fetchTopTracks() {
    try {
      const response = await fetch('http://localhost:8000/top-tracks', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      document.querySelector('#top-tracks').innerHTML = JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error fetching top tracks: ', error);
    }
  }
  
  fetchTopTracks();
});