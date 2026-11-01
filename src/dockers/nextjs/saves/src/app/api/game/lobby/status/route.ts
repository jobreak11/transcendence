import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../../lib/constants";

export async function GET(request: NextRequest) {
  const lobbyPinId = request.nextUrl.searchParams.get("lobbyPinId");
  if (!lobbyPinId) {
    return NextResponse.json(
      { message: "A lobby ID is required." },
      { status: 400 },
    );
  }

  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json(
      { message: "You must sign in to check lobby status." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/game/lobby/status?lobbyPinId=${encodeURIComponent(lobbyPinId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type")
          ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to check lobby status", error);
    return NextResponse.json(
      { message: "Could not reach the lobby service. Try again." },
      { status: 502 },
    );
  }
}
