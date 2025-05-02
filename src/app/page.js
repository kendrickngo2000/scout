"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import NowPlaying from "../components/NowPlaying";
import { Pie } from "react-chartjs-2"; 
import Chart from "chart.js/auto";

export function DebugLogout() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </button>
  );
}

// Spotify Insights Section
function SpotifyInsights() {
  const [view, setView] = useState(null); // 'tracks', 'genres', 'recent'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (type) => {
    setLoading(true);
    setError(null);
    setView(type);

    try {
      const res = await fetch(`/api/spotify/${type}`);
      const json = await res.json();

      if (!json.items || !Array.isArray(json.items) || json.items.length === 0) {
        setError("No data found for the selected category.");
        setData(null);
      } else {
        setData(json);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!view) return null;
    if (loading) return <p>Loading {view}...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    const items = data?.items || [];

    if (view === "top-songs") {
      return (
        <div>
          <h3 className="text-xl font-semibold mb-2">Your Top Tracks</h3>
          <ul className="space-y-1">
            {items.map((track) => (
              <li key={track.id}>
                <a
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-green-400"
                >
                  {track.name} – {track.artists[0].name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (view === "top-genres") {
      const genreCounts = {};
      data.items.forEach((artist) => {
        artist.genres.forEach((genre) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });

      const chartData = {
        labels: Object.keys(genreCounts),
        datasets: [
          {
            data: Object.values(genreCounts),
            backgroundColor: Object.keys(genreCounts).map(
              (_, i) => `hsl(${i * 30}, 70%, 50%)`
            ),
          },
        ],
      };

      return (
        <div className="max-w-md">
          <h3 className="text-xl font-semibold mb-2">Your Favorite Genres</h3>
          <Pie data={chartData} />
        </div>
      );
    }

    if (view === "recently-played") {
      return (
        <div>
          <h3 className="text-xl font-semibold mb-2">Recently Played</h3>
          <ul className="space-y-1">
            {data.items
              .filter((item) => item.track && item.track.external_urls?.spotify)
              .map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.track.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-400"
                  >
                    {item.track.name} – {item.track.artists[0].name}
                  </a>
                </li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="mt-20 border-t border-gray-700 pt-10">
      <h2 className="text-2xl font-bold mb-4">Spotify Insights</h2>
      <div className="space-x-4 mb-6">
        <button
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => fetchData("top-songs")}
        >
          Favorite Tracks
        </button>
        <button
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded"
          onClick={() => fetchData("top-genres")}
        >
          Favorite Genres
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => fetchData("recently-played")}
        >
          Recently Played
        </button>
      </div>
      <div>{renderContent()}</div>
    </section>
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
  const [nowPlayingTrack, setNowPlayingTrack] = useState(null);

  useEffect(() => {
    if (session?.accessToken && !scriptLoaded.current) {
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

        newPlayer.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
          setPlayer(newPlayer);
          fetchPlaylists();
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
      const res = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      console.log("🎧 Playlist API response:", res.data);

      if (!res.data || !res.data.items) {
        console.warn("No playlist items returned:", res.data);
      }

      setPlaylists(res.data.items);
    } catch (error) {
      console.error("Error fetching playlists:", error.response?.data || error.message);
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

  const playTrack = async (trackUri, track) => {
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
      console.log("Play response:", response.status);
      setNowPlayingTrack(track);
    } catch (error) {
      setError(`Play Error: ${error.response?.data?.error?.message || error.message}`);
      console.error("Full error:", error);
    }
  };

  if (nowPlayingTrack) {
    return (
      <NowPlaying
        track={nowPlayingTrack}
        onClose={() => setNowPlayingTrack(null)}
      />
    );
  }

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
    <main className="relative flex flex-col min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">scout</h1>

      <button
        onClick={() => signOut()}
        className="absolute top-4 right-4 px-2 py-1 bg-red-500 hover:bg-red-400 text-white font-semibold rounded text-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-800 ${
                selectedPlaylistId === playlist.id ? 'border-green-500' : 'border-gray-700'
              }`}
              onClick={() => handlePlaylistSelect(playlist.id)}
            >
              <h3 className="text-lg font-semibold">{playlist.name}</h3>
              <p className="text-sm text-gray-400">{playlist.tracks.total} tracks</p>
            </div>
          ))}
        </div>
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
              trackObject.track ? (
                <li key={trackObject.track.id} className="flex items-center justify-between py-1">
                  <span>{trackObject.track.name}</span>
                  <button
                    className="px-2 py-1 bg-green-500 hover:bg-green-400 text-black rounded-full text-sm"
                    onClick={() => playTrack(trackObject.track.uri, trackObject.track)}
                  >
                    Play
                  </button>
                </li>
              ) : null
            ))}
            </ul>
          ) : (
            <p>No tracks found in this playlist.</p>
          )}
        </div>
      )}
      <SpotifyInsights />
    </main>
  );
}
