import { put } from "@vercel/blob";
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

    // Log to verify your environment variable is loaded
    console.log("Using Blob token:", process.env.BLOB_READ_WRITE_TOKEN ? "✅ Found" : "❌ Missing");

    // Upload JSON to your blob store
    const blob = await put(filename, content, {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: true, // ✅ enable overwriting the same blob
  token: process.env.BLOB_READ_WRITE_TOKEN,
});


    console.log("✅ Blob uploaded successfully:", blob.url);
    return res.status(200).json({ url: blob.url });
  } catch (error: any) {
    console.error("❌ Upload failed:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
}
