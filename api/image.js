export default async function handler(req, res) {
  const prompt = decodeURIComponent(req.query.prompt || "");
  const width = req.query.width || "1024";
  const height = req.query.height || "1024";

  if (!prompt) return res.status(400).send("Missing prompt");

  const apiResp = await fetch("https://sunlea.de/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer sk-eDkcoNTDDWX6LbJkFkqyZaVAsDeY3yDUJa6zKgLWWZBmjYB5",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      messages: [{ role: "user", content: prompt }],
      size: `${width}x${height}`,
    }),
  });

  if (!apiResp.ok) {
    const err = await apiResp.text();
    return res.status(502).send(`API Error ${apiResp.status}: ${err}`);
  }

  const data = await apiResp.json();
  const content = data?.choices?.[0]?.message?.content;
  
  let b64 = null;
  let imageUrl = null;
  try {
    const parsed = JSON.parse(content);
    b64 = parsed?.b64_json || parsed?.data?.[0]?.b64_json;
    imageUrl = parsed?.url || parsed?.data?.[0]?.url;
  } catch {
    if (content?.startsWith("http")) imageUrl = content;
  }

  if (imageUrl) {
    const img = await fetch(imageUrl);
    const buf = await img.arrayBuffer();
    res.setHeader("Content-Type", img.headers.get("Content-Type") || "image/png");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(Buffer.from(buf));
  }

  if (b64) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(Buffer.from(b64, "base64"));
  }

  res.status(502).send(`Unknown format: ${JSON.stringify(data)}`);
}
