import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Play, Pause, SkipForward, SkipBack, ArrowLeft } from "lucide-react";
import Link from "next/link"

export default function NowPlaying({ track, onClose }) {
  const { data: session } = useSession();
  const [lyrics, setLyrics] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const lyricsContainerRef = useRef(null);

  // display lyrics
  useEffect(() => {
    const fetchLyrics = async () => {
      if (!track?.id || !session?.accessToken) return;

      try {
        const response = await axios.get(
          `/api/nowPlaying?title=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artists[0].name)}`
        );
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
        if (state) {
          setCurrentTime(state.position / 1000);
          setDuration(state.duration / 1000);
          setIsPlaying(!state.paused);
        }
      });
    }, 300);

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

  const handleSeek = (event) => {
    const newTime = (event.target.value / 100) * duration;
    setCurrentTime(newTime);
    if (window.player) window.player.seek(newTime * 1000);
  };

  const togglePlay = () => {
    if (window.player) {
      if (isPlaying) {
        window.player.pause();
      } else {
        window.player.resume();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!track) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">       
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between px-6 pt-4">
        <button
          onClick={onClose}
          className="flex items-center text-gray-300 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2"/>
          Back
        </button>
      </div>

      {/* Album & Info */}
      <div className="flex flex-col items-center mt-8">
        <img
          src={track.album.images[0]?.url}
          alt={track.name}
          className="w-48 h-48 rounded-lg shadow-lg mb-4"
        />
        <h2 className="text-xl font-semibold">{track.name}</h2>
        <p className="text-sm text-gray-400">{track.artists.map(a => a.name).join(", ")}</p>
      </div>

      {/* Scrub Bar */}
      <div className="px-8 mt-4">
        <input
          type="range"
          min="0"
          max="100"
          value={(currentTime / duration) * 100 || 0}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Media Controls */}
      <div className="flex items-center justify-center gap-8 mt-6">
        <SkipBack className="w-6 h-6 cursor-pointer opacity-60 hover:opacity-100" />
        {isPlaying ? (
          <Pause
            onClick={togglePlay}
            className="w-8 h-8 cursor-pointer opacity-90 hover:opacity-100"
          />
        ) : (
          <Play
            onClick={togglePlay}
            className="w-8 h-8 cursor-pointer opacity-90 hover:opacity-100"
          />
        )}
        <SkipForward className="w-6 h-6 cursor-pointer opacity-60 hover:opacity-100" />
      </div>

      {/* Lyrics */}
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto mt-6 mx-6 mb-4 p-4 bg-gray-900 rounded-lg shadow-inner"
      >
        <h3 className="text-md font-bold mb-3 text-gray-300">Lyrics</h3>
        <div className="space-y-1">
          {lyrics.map((line, index) => {
            const nextLine = lyrics[index + 1];
            const isCurrent =
              currentTime >= line.time &&
              (!nextLine || currentTime < nextLine.time);

            return (
              <p
                key={index}
                className={`transition-all duration-200 ${
                  isCurrent
                    ? "text-green-400 font-semibold current-line"
                    : "text-gray-500"
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

function formatTime(seconds) {
  const min = Math.floor(seconds / 60) || 0;
  const sec = Math.floor(seconds % 60) || 0;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

