import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await prisma.user_tokens.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        provider: true,
        token_hint: true,
        label: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, token, label = "Default" } = body as {
      provider?: string;
      token?: string;
      label?: string;
    };

    if (!provider || (provider !== "github" && provider !== "vercel")) {
      return NextResponse.json(
        { error: "Valid provider ('github' or 'vercel') is required" },
        { status: 400 }
      );
    }

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const cleanToken = token.trim();
    const cleanLabel = (label || "Default").trim().slice(0, 50);

    // Compute hint (e.g. ghp_...1234 or ver_...5678)
    const tokenHint =
      cleanToken.length > 8
        ? `${cleanToken.slice(0, 4)}...${cleanToken.slice(-4)}`
        : `****${cleanToken.slice(-4)}`;

    const encryptedToken = encryptToken(cleanToken);

    const saved = await prisma.user_tokens.upsert({
      where: {
        user_id_provider_label: {
          user_id: user.id,
          provider: provider.toLowerCase(),
          label: cleanLabel,
        },
      },
      update: {
        encrypted_token: encryptedToken,
        token_hint: tokenHint,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        provider: provider.toLowerCase(),
        label: cleanLabel,
        encrypted_token: encryptedToken,
        token_hint: tokenHint,
      },
      select: {
        id: true,
        provider: true,
        token_hint: true,
        label: true,
        created_at: true,
      },
    });

    return NextResponse.json({ token: saved }, { status: 201 });
  } catch (error) {
    console.error("Error saving user token:", error);
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Token ID is required" }, { status: 400 });
    }

    await prisma.user_tokens.deleteMany({
      where: {
        id,
        user_id: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user token:", error);
    return NextResponse.json({ error: "Failed to delete token" }, { status: 500 });
  }
}
