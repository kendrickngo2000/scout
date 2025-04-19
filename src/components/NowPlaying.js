import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

export default function NowPlaying({ track, onClose }) {
  const { data: session } = useSession();
  const [lyrics, setLyrics] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const lyricsContainerRef = useRef(null);

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!track?.id || !session?.accessToken) return;

      try {
        const response = await axios.get(
          `/api/lyrics?trackId=${track.id}&accessToken=${session.accessToken}`);
        setLyrics(response.data.lyrics);
      } catch (error) {
        console.error("Error fetching lyrics:", error);
      }
    };
    fetchLyrics();
  }, [track]);

  useEffect(() => {
    if (!window.player) return;

    const interval = setInterval(() => {
      window.player.getCurrentState().then((state) => {
        if (state && !state.paused) {
          setCurrentTime(state.position / 1000);
          setDuration(state.duration / 1000);
        }
      });
    }, 300); // try slightly longer interval to reduce CPU

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  const container = lyricsContainerRef.current;
  const activeLine = container?.querySelector(".current-line");

  if (activeLine && container) {
    container.scrollTo({
      top: activeLine.offsetTop - container.offsetHeight / 2,
      behavior: "smooth",
    });
  }
}, [currentTime]);

  useEffect(() => {
    console.log("lyrics loaded", lyrics);
  }, [lyrics]);

  const handleSeek = (event) => {
    const newTime = (event.target.value / 100) * duration;
    setCurrentTime(newTime);
    if (window.player) {
      window.player.seek(newTime * 1000);
    }
  };

  if (!track) return null;

  return (
    <div className="flex h-screen">
      {/* Left Panel: Album + Info */}
      <div className="w-1/4 bg-gray-900 text-white flex flex-col items-center p-4">
        <img
          src={track.album.images[0]?.url}
          alt={track.name}
          className="w-full h-auto mb-4"
        />
        <h2 className="text-xl font-bold">{track.name}</h2>
        <p className="text-sm text-gray-400">
          {track.artists.map((a) => a.name).join(", ")}
        .</p>
        <input
          type="range"
          min="0"
          max="100"
          value={(currentTime / duration) * 100 || 0}
          onChange={handleSeek}
          className="w-full mt-4"
        />
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded"
        >
          return
        </button>
      </div>

      {/* Right Panel: Lyrics */}
      <div
        ref={lyricsContainerRef}
        className="w-3/4 bg-black text-white p-8 overflow-y-auto"
      >
        <h3 className="text-lg font-bold mb-4">Lyrics</h3>
        <div>
          {lyrics.map((line, index) => {
            const nextLine = lyrics[index + 1];
            const isCurrent =
              currentTime >= line.time &&
              (!nextLine || currentTime < nextLine.time);

            return (
            <p
              key={index}
              className={`mb-2 transition-colors duration-200 ${
                isCurrent ? "text-green-500 font-bold current-line" : "text-gray-400"
              }`}
            >
              {line.text}
            </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
