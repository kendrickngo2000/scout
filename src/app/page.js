"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

export function DebugLogout() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </button>
  );
}

export default function Page() {
  const { data: session } = useSession();
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (session?.accessToken && !scriptLoaded.current) {
      // Load Spotify Web Playback SDK script
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      scriptLoaded.current = true;
      
      window.onSpotifyWebPlaybackSDKReady = () => {
        const newPlayer = new window.Spotify.Player({
          name: 'scout Web Player',
          getOAuthToken: cb => cb(session.accessToken),
          volume: 0.5,
        });

        // Event handlers
        newPlayer.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
          setPlayer(newPlayer);
          fetchPlaylists(); // Fetch playlists after player is ready
          axios
          .put(
            'https://api.spotify.com/v1/me/player',
            { device_ids: [device_id], play: true },
            { headers: { Authorization: `Bearer ${session.accessToken}` } }
          )
            .then(() => console.log('Playback transferred to Web Player'))
            .catch((err) => console.error('Transfer playback error:', err));
        });

        newPlayer.addListener('not_ready', ({ device_id }) => {
          console.log('Device has gone offline', device_id);
        });

        newPlayer.addListener('initialization_error', ({ message }) => {
          setError(`Initialization Error: ${message}`);
        });

        newPlayer.addListener('authentication_error', ({ message }) => {
          setError(`Auth Error: ${message}`);
        });

        newPlayer.addListener('account_error', ({ message }) => {
          setError(`Account Error: ${message}`);
        });

        newPlayer.connect().catch(error => {
          setError(`Player Connect Error: ${error}`);
        });

        // Store player for cleanup
        setPlayer(newPlayer);
      };
    }

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [session?.accessToken]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setPlaylists(response.data.items);
    } catch (error) {
      setError(`Error fetching playlists: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistSelect = (playlistId) => {
    setSelectedPlaylistId(playlistId);
    fetchPlaylistTracks(playlistId);
  };

  const fetchPlaylistTracks = async (playlistId) => {
    if (!playlistId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      setPlaylistTracks(response.data.items);
    } catch (error) {
      setError(`Error fetching tracks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

const playTrack = async (trackUri) => {
  if (!deviceId || !trackUri || !session?.accessToken) {
    console.error("Missing required parameters:", { deviceId, trackUri, accessToken: !!session?.accessToken });
    return;
  }

  try {
    console.log("Attempting to play:", trackUri);
    console.log("On device:", deviceId);

    const response = await axios.put(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      { uris: [trackUri] },
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log("Play response:", response.status); // Should log 204 if successful
  } catch (error) {
    setError(`Play Error: ${error.response?.data?.error?.message || error.message}`);
    console.error("Full error:", error);
  }
};


  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <h1 className="text-6xl font-bold mb-8">scout</h1>
        <button
          onClick={() => signIn("spotify")}
          className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition"
        >
          login with spotify
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">scout</h1>

      <button
        onClick={() => signOut()}
        className="mb-4 px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded"
      >
        sign out
      </button>
      
      {error && (
        <div className="mb-4 p-2 bg-red-500 text-white rounded">
          Error: {error}
        </div>
      )}

      {deviceId ? (
        <p className="mb-4 text-green-500">Spotify Player Ready!</p>
      ) : (
        <p className="mb-4">Loading Spotify Player...</p>
      )}

      <h2 className="text-xl font-semibold mb-2">Your Playlists</h2>
      {loading ? (
        <p>Loading...</p>
      ) : playlists.length > 0 ? (
        <ul className="mb-4">
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              className={`cursor-pointer hover:underline ${
                selectedPlaylistId === playlist.id ? 'text-green-500' : ''
              }`}
              onClick={() => handlePlaylistSelect(playlist.id)}
            >
              {playlist.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No playlists found.</p>
      )}

      {selectedPlaylistId && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Tracks in {playlists.find((p) => p.id === selectedPlaylistId)?.name}
          </h3>
          {loading ? (
            <p>Loading tracks...</p>
          ) : playlistTracks.length > 0 ? (
            <ul>
            {playlistTracks.map((trackObject) => (
              trackObject.track ? ( // Ensure trackObject.track exists
                <li key={trackObject.track.id} className="flex items-center justify-between py-1">
                  <span>{trackObject.track.name}</span>
                  <button
                    className="px-2 py-1 bg-green-500 hover:bg-green-400 text-black rounded-full text-sm"
                    onClick={() => playTrack(trackObject.track.uri)}
                  >
                    Play
                  </button>
                </li>
              ) : null // Skip rendering if trackObject.track is null
            ))}
            </ul>
          ) : (
            <p>No tracks found in this playlist.</p>
          )}
        </div>
      )}
    </main>
  );
}
