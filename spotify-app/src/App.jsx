import { useState } from 'react'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [topTracks, setTopTracks] = useState(null)

  // Placeholder function for login/logout
  const handleLoginClick = async () => {
    if (isLoggedIn) {
      // login logic
      setIsLoggedIn(false)
      setUserName('')
      setTopTracks(null)
    } else {
      try {
        const response = await fetch('/login', {
          headers: {
            'X-Requested-With':
            'XMLHttpRequest'
          }
        });
        const data = await response.json()
          window.location.href = data.auth_url
      } catch (error) {
        console.error('Error during login:', error)
      }
    }
  }

  // Placeholder function for fetching top tracks
  const fetchTopTracks = () => {
    // Replace with actual API call to Spotify
    setTopTracks([
      { id: 1, name: 'Track 1', artist: 'Artist 1', albumCover: 'https://via.placeholder.com/150' },
      { id: 2, name: 'Track 2', artist: 'Artist 2', albumCover: 'https://via.placeholder.com/150' },
      // Add more placeholder tracks as needed
    ])
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-black p-4">
        <nav className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img src="/path-to-your-logo.svg" alt="Logo" className="w-8 h-8 mr-2" />
            <h1 className="text-xl font-bold">Scout</h1>
          </div>
          <button 
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-full"
            onClick={handleLoginClick}
          >
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto mt-10 p-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          {isLoggedIn ? `Welcome, ${userName}!` : "Discover Your Spotify Favorites"}
        </h2>
        
        <div className="flex justify-center mb-8">
          <button 
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-full text-lg font-semibold"
            onClick={isLoggedIn ? fetchTopTracks : handleLoginClick}
          >
            {isLoggedIn ? "Show My Top Tracks" : "Connect with Spotify"}
          </button>
        </div>

        {/* Results Grid */}
        {topTracks && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {topTracks.map((track) => (
              <div key={track.id} className="bg-gray-800 p-4 rounded-lg">
                <img src={track.albumCover} alt={track.name} className="w-full h-40 object-cover rounded-md mb-2" />
                <h3 className="font-semibold">{track.name}</h3>
                <p className="text-gray-400">{track.artist}</p>
                <button className="mt-2 bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full text-sm">
                  Play on Spotify
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
