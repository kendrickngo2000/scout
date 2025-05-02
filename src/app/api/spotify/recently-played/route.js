// // File: /api/spotify/top-genres/route.js
// import { getServerSession } from "next-auth";
// import { authOptions } from "../../auth/[...nextauth]/route";
// import { NextResponse } from "next/server";

// export const GET = async () => {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || !session.accessToken) {
//       console.error("No access token");
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const url = "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=10";
//     const res = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${session.accessToken}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const data = await res.json();
//     if (!res.ok) {
//       return NextResponse.json({ error: "Spotify API error", details: data }, { status: res.status });
//     }

//     return NextResponse.json({ items: data.items || [] });
//   } catch (err) {
//     console.error("Server error:", err);
//     return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
//   }



import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const GET = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = "https://api.spotify.com/v1/me/player/recently-played?limit=50";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`, // ✅ fixed missing backticks
      },
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error("Spotify API error:", raw);
      return NextResponse.json({ error: "Spotify API error", details: raw }, { status: response.status });
    }

    if (!raw) {
      return NextResponse.json({ error: "Empty response from Spotify" }, { status: 204 });
    }

    const data = JSON.parse(raw);

    // Transform and clean
    const items = data.items?.map((item) => ({
      track_name: item.track.name,
      artist: item.track.artists[0]?.name,
      url: item.track.external_urls.spotify,
      played_at: item.played_at,
    })) || [];

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Unexpected server error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
};
