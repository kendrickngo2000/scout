import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      console.error("No access token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10";
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: "Spotify API error", details: data }, { status: res.status });
    }

    return NextResponse.json({ items: data.items || [] });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
};