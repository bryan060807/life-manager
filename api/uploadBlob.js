// api/uploadBlob.js
import { put } from "@vercel/blob";

export const config = {
  runtime: "nodejs", // ✅ switch from "edge" to "nodejs"
};

export default async function handler(req, res) {
  try {
    const { filename, content } = req.body;

    const { url } = await put(`tasks/${filename}`, content, {
      access: "public",
    });

    return res.status(200).json({ url });
  } catch (err) {
    console.error("Blob upload failed:", err);
    return res.status(500).json({ error: err.message });
  }
}
