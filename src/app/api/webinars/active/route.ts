import { NextResponse } from "next/server";
import { getCachedActiveWebinar } from "@/lib/active-webinar";

export async function GET() {
  try {
    const webinar = await getCachedActiveWebinar();
    return NextResponse.json(
      { webinar },
      {
        // The database result is cached and tag-invalidated on the server.
        // Do not add a second CDN cache that can outlive an admin update.
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Active webinar lookup failed", error);
    return NextResponse.json(
      { error: "Could not load the active webinar" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
