import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  const session = await getServerSession(authOptions); // No req needed in App Router
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch("https://api.spotify.com/v1/me/top/tracks", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
  const data = await response.json();
  return NextResponse.json(data);
};