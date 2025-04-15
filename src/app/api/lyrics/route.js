// app/api/lyrics/route.js

// Helper: Get track info from Spotify
async function getTrackInfo(trackId, accessToken) {
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch track info from Spotify");
  }

  return await res.json();
}

// Main API route
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("trackId");
  const accessToken = searchParams.get("accessToken");

  if (!trackId || !accessToken) {
    return new Response(JSON.stringify({ error: "Missing trackId or accessToken" }), {
      status: 400,
    });
  }

  try {
    // Step 1: Get track name and artist
    const trackInfo = await getTrackInfo(trackId, accessToken);
    const artist = trackInfo.artists[0]?.name;
    const title = trackInfo.name;

    // Step 2: Fetch lyrics
    const lyricsText = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`)
      .then((res) => res.json())
      .then((data) => data.lyrics);

    // Step 3: Convert to array (basic line-by-line for demo purposes)
    const lyrics = lyricsText
      .split("\n")
      .filter(Boolean)
      .map((line, i) => ({ time: i * 10, text: line }));

    return new Response(JSON.stringify({ lyrics }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Could not fetch lyrics" }), {
      status: 500,
    });
  }
}
