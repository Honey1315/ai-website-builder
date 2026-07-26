import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("x-vercel-token");
    if (!token) {
      return NextResponse.json({ error: "Missing Vercel token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("deploymentId");

    if (!deploymentId) {
      return NextResponse.json({ error: "Missing deploymentId" }, { status: 400 });
    }

    const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!statusRes.ok) {
      const errorData = await statusRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to fetch status: ${errorData.error?.message || statusRes.statusText}` },
        { status: statusRes.status }
      );
    }

    const data = await statusRes.json();

    return NextResponse.json({
      status: data.readyState, // QUEUED, BUILDING, READY, ERROR, CANCELED
      url: data.url ? `https://${data.url}` : null,
      error: data.error?.message,
    });

  } catch (error: any) {
    console.error("Vercel status error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
