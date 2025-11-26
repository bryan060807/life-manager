// api/uploadBlob.js
import { put } from "@vercel/blob";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { filename, content } = await req.json();

    const { url } = await put(`tasks/${filename}`, content, {
      access: "public",
    });

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
