import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Safely pull plain text from a Responses API object across SDK versions */
function responsesToText(r) {
  if (!r) return "";
  if (typeof r.output_text === "string") return r.output_text;
  if (Array.isArray(r.output)) {
    return r.output
      .map(part =>
        Array.isArray(part.content)
          ? part.content.map(c => (typeof c.text === "string" ? c.text : "")).join("")
          : ""
      )
      .join("");
  }
  // Older shapes fall back to choices/message.content if present
  return r.choices?.[0]?.message?.content || "";
}

/** Make a compact candidate list to keep tokens under control */
function compactCandidates(items, limit = 7) {
  return items.slice(0, limit).map(i => ({
    title: i.title,
    year: i.year || "",
    genres: Array.isArray(i.genres) ? i.genres.slice(0, 4) : [],
    // cap synopsis length to avoid blowing context
    synopsis: (i.synopsis || "").replace(/\s+/g, " ").slice(0, 300)
  }));
}

export async function enrichRecommendations(seedTitle, items) {
  if (!process.env.OPENAI_API_KEY || !Array.isArray(items) || items.length === 0) {
    console.warn("⚠️ Skipping ChatGPT enrichment: missing key or empty items");
    return "No enrichment available.";
  }

  const candidates = compactCandidates(items, 7);

  const system =
    "You are an anime recommendation analyst. Be concise, specific, and concrete.";
  const user = `
User liked: ${seedTitle}

Consider ONLY these candidates:
${candidates.map((i, idx) =>
  `${idx + 1}. ${i.title}${i.year ? " (" + i.year + ")" : ""} | genres: ${i.genres.join(", ") || "n/a"} | synopsis: ${i.synopsis}`
).join("\n")}

For EACH candidate, do:
- 1–2 sentence reason that references tone, pacing, emotional impact, and (when relevant) production quality.
- Provide three ratings from 1–10: Tone, Pacing, Emotional Impact.

Return exactly one bullet per candidate, like:
- Title (Year): short reason. Tone: x/10 · Pacing: y/10 · Emotional: z/10.
  `.trim();

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"; // mini is reliable & cheaper

  // 1) Try Chat Completions (most stable text endpoint)
  try {
    const chat = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.2,
      max_tokens: 900
    });

    const text = chat.choices?.[0]?.message?.content?.trim();
    if (text) return text;
    throw new Error("Empty completion");
  } catch (err) {
    console.error("⚠️ Chat Completions failed:", err?.response?.data || err?.message || err);
  }

  // 2) Fallback: Responses API with robust text extraction
  try {
    const res = await openai.responses.create({
      model,
      input: `SYSTEM: ${system}\n\nUSER: ${user}`,
      temperature: 0.2,
      max_output_tokens: 900
    });

    console.log("📦 Raw Responses payload (truncated):", JSON.stringify({
      id: res.id, model: res.model, created: res.created, output_len: Array.isArray(res.output) ? res.output.length : undefined
    }, null, 2));

    const out = responsesToText(res).trim();
    if (out) return out;
    throw new Error("Responses API returned no text");
  } catch (err2) {
    console.error("❌ Responses API failed:", err2?.response?.data || err2?.message || err2);
    return "Sorry, enrichment failed right now.";
  }
}
