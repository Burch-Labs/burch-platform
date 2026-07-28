import { NextRequest, NextResponse } from "next/server";
import { Client } from "@replit/object-storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");

  // Only serve objects from our event-images prefix
  if (!objectKey.startsWith("event-images/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const client = new Client();
  const result = await client.downloadAsBytes(objectKey);

  if (!result.ok) {
    console.error("[images] Object storage error:", result.error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [buffer] = result.value;

  // Infer content type from extension
  const ext = objectKey.split(".").pop()?.toLowerCase();
  const contentTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  const contentType = (ext && contentTypeMap[ext]) ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
