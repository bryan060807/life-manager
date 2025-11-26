import { put, list } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, content } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: "Missing filename or content" });
    }

    // Ensure token exists
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("❌ Missing BLOB_READ_WRITE_TOKEN");
      return res.status(500).json({ error: "Missing BLOB_READ_WRITE_TOKEN" });
    }

    // Parse payload to verify structure
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    // ✅ Backward compatible: if payload doesn’t contain meta/tasks, wrap it
    const blobPayload = parsed.tasks
      ? parsed
      : {
          meta: {
            deviceId: "unknown",
            lastSyncedAt: Date.now(),
          },
          tasks: Array.isArray(parsed) ? parsed : [],
        };

    // 🔄 Fetch existing blob (if available)
    const existingList = await list({ token });
    const existing = existingList.blobs.find((b) => b.pathname === filename);

    if (existing) {
      console.log("♻️ Overwriting existing blob:", existing.url);
    } else {
      console.log("🆕 Creating new blob:", filename);
    }

    // 🚀 Upload the payload
    const blob = await put(filename, JSON.stringify(blobPayload, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
      contentType: "application/json",
    });

    console.log("✅ Blob synced successfully:", blob.url);
    return res.status(200).json({ url: blob.url });
  } catch (error: any) {
    console.error("❌ Upload failed:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
}
