import { put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, content } = req.body;

    // Upload JSON content to Vercel Blob
    const blob = await put(filename, content, {
      access: "public",
      addRandomSuffix: false, // keeps filename consistent for sync
    });

    console.log("✅ Blob uploaded:", blob.url);

    // Return the public URL so your app can use it
    return res.status(200).json({ url: blob.url });
  } catch (error: any) {
    console.error("❌ Blob upload error:", error);
    return res.status(500).json({ error: error.message || "Upload failed" });
  }
}
