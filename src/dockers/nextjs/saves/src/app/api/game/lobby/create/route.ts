import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../../lib/constants";

export async function POST() {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json(
      { message: "You must sign in before creating a lobby." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/game/lobby/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomType: "PUBLIC",
        catchPhrase: "Game created from the game page",
        gameSettings: {
          maxPlayer: 8,
          maxSpectator: 0,
          format: "BEGINNER",
        },
      }),
      cache: "no-store",
    });
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type")
          ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to create lobby", error);
    return NextResponse.json(
      { message: "Could not reach the lobby service. Try again." },
      { status: 502 },
    );
  }
}
