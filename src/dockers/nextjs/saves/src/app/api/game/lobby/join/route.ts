import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../../lib/constants";

export async function POST(request: NextRequest) {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json(
      { message: "You must sign in before joining a lobby." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid join request." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object"
    || body === null
    || !("lobbyPinId" in body)
    || typeof body.lobbyPinId !== "string"
    || !/^\d{6}$/.test(body.lobbyPinId)
    || !("password" in body)
    || typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { message: "A valid six-digit lobby ID and password are required." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/game/lobby/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lobbyPinId: body.lobbyPinId,
        isSpectator: false,
        ...(body.password ? { password: body.password } : {}),
      }),
      cache: "no-store",
    });
    const responseBody = await response.text();

    return new NextResponse(responseBody || null, {
      status: response.status,
      headers: responseBody
        ? {
            "Content-Type": response.headers.get("content-type")
              ?? "application/json",
          }
        : undefined,
    });
  } catch (error) {
    console.error("Failed to join lobby", error);
    return NextResponse.json(
      { message: "Could not reach the lobby service. Try again." },
      { status: 502 },
    );
  }
}
