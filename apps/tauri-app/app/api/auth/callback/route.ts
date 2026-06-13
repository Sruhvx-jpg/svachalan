import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: error, error_description: searchParams.get("error_description") },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

  try {
    // Store the code and state temporarily (could be in session/cookie)
    // Then redirect back to the app with these params
    const response = NextResponse.redirect(
      new URL(
        `/auth/callback-handler?code=${code}&state=${state}&plugin=gmail`,
        request.url
      )
    );

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Failed to process OAuth callback" },
      { status: 500 }
    );
  }
}
