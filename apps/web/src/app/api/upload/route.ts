import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Client } from "@replit/object-storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  // Any signed-in user — the public event submission form uploads photos
  // before the submitter has a partner profile (that's created alongside the
  // event itself). An unreferenced upload is just an orphaned file, the same
  // risk a partner already has if they upload and abandon a draft.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 5 MB" },
      { status: 400 },
    );
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const objectKey = `event-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const client = new Client();
  const { ok, error } = await client.uploadFromBytes(objectKey, buffer);

  if (!ok) {
    console.error("[upload] Object storage error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Return a relative URL that goes through our image-serving proxy
  const url = `/api/images/${objectKey}`;
  return NextResponse.json({ url });
}
