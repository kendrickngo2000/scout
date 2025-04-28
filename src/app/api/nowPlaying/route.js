import axios from "axios";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!title || !artist) {
    return new Response(JSON.stringify({ error: "Missing title or artist" }), { status: 400 });
  }

  try {
    const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
    const lyricsText = res.data.lyrics;

    if (!lyricsText) {
      return new Response(JSON.stringify({ error: "No lyrics found" }), { status: 404 });
    }

    const lyricsArray = lyricsText
      .split("\n")
      .filter(Boolean)
      .map((line, index) => ({
        startTimeMs: index * 5000, // fake timing (optional)
        text: line,
      }));

    return new Response(JSON.stringify({ lyrics: lyricsArray }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Lyrics fetch error:", err.message);
    return new Response(JSON.stringify({ error: "Lyrics fetch failed" }), { status: 500 });
  }
}
