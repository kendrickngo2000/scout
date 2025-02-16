import React, { useState, useEffect } from "react";
import { getUserProfile } from "./api";


function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        getUserProfile().then(data => setUser(data));
    }, []);

    return (
        <div className="App">
            <h1>Spotify Scout 🎵</h1>
            {user ? (
                <div>
                    <h2>Welcome, {user.display_name}!</h2>
                    <img src={user.images?.[0]?.url} alt="Profile" width="100" />
                    <p>{user.email}</p>
                </div>
            ) : (
                <a href="http://localhost:8000/login">
                    <button>Login with Spotify</button>
                </a>
            )}
        </div>
    );
}

export default App;
