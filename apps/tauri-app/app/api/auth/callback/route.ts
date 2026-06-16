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
    // --- EXTRACT PLUGIN FROM STATE ---
    let extractedPlugin = "";
    try {
      // Split by '.' to drop any attached cryptographic signature hashes
      const base64Payload = state.split(".")[0];
      // Decode base64 to plain text string and parse to JSON
      const decodedState = JSON.parse(atob(base64Payload));
      
      extractedPlugin = decodedState.plugin || ""; 
    } catch (e) {
      console.error("Failed to safely decode plugin state string:", e);
    }

    // Pass the safely extracted plugin name into your next redirect handler route
    const response = NextResponse.redirect(
      new URL(
        `/auth/callback-handler?code=${code}&state=${encodeURIComponent(state)}&plugin=${extractedPlugin}`,
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