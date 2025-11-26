import { put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Force Node.js runtime for compatibility
export const config = {
  runtime: "nodejs20",
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

    // Upload JSON content to Vercel Blob
    const blob = await put(filename, content, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log("✅ Uploaded to Blob:", blob.url);
    return res.status(200).json({ url: blob.url });
  } catch (error: any) {
    console.error("❌ Upload failed:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
