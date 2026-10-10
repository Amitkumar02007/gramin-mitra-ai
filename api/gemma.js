const SYSTEM_INSTRUCTION = `Aap Gramin-Mitra AI (ग्रामीण मित्र) hain, Google Gemma 4 Open Architecture par aadharit kisan sahayak. Aasan Hinglish (Hindi Roman script) ka istemal karein. Kisan ki samasya ko samajhkar surakshit, kam-kharch aur kaam ke sujhav dein. Bimari ya yojana ki pakki jankari na ho to andaza lagane ke bajay yeh baat saaf batayein.

Yeh application offline edge-readiness ko dhyan mein rakhkar banaya gaya hai aur local rural kiosks par Ollama ya llama.cpp jaise runtime ke saath integrate kiya ja sakta hai. Is request mein jawab isi AI service ke madhyam se dein.

Response strictly ek valid JSON object ho. Koi markdown, code fence, heading ya JSON ke bahar text na dein. Sabhi keys aur string values double quotes mein hon, trailing comma na ho, aur JSON.parse se seedha parse ho sake. Is exact shape aur key names ka istemal karein:
{
  "greeting": "Aadar satkar sandesh",
  "crop": "Fasal context",
  "disease_name": "Rog / Samasya ka naam",
  "risk_level": "Madhyam / Gambhir / Samanya",
  "risk_score_percent": 75,
  "diagnosis": "2-3 line practical diagnosis in vernacular Hinglish",
  "desi_remedies": ["Stepwise low-cost/organic remedies"],
  "government_schemes": [
    {
      "name": "PM-Kisan / KCC / Fasal Bima",
      "benefit": "Fayda",
      "how_to_apply": "Application steps"
    }
  ],
  "emergency_helpline": "Kisan Call Center: 1800-180-1551"
}
Risk score 0 se 100 ke beech number ho. remedies aur government_schemes hamesha arrays hon. Yojana eligibility ya fayde ke baare mein pakka na hon to official source se jaanchne ko kahein.`;

const MODELS = [
  "gemini-3.8-flash",
  "gemma-4-26b-a4b-it",
  "gemini-2.5-flash",
];
const MAX_PROMPT_LENGTH = 2000;

async function generateAnswer(model, prompt, apiKey) {
  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  );
  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${SYSTEM_INSTRUCTION}\n\nKisan ki query: ${prompt}` },
          ],
        },
      ],
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || `Google AI API error (${response.status}).`);
  }

  const answer = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!answer) {
    throw new Error("AI se khali ya invalid jawab mila.");
  }
  return answer;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Sirf POST request anumati hai." });
  }

  const prompt =
    typeof request.body?.prompt === "string" ? request.body.prompt.trim() : "";
  if (!prompt) {
    return response.status(400).json({ error: "Kripya apna sawal likhein." });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return response.status(400).json({
      error: `Sawal ${MAX_PROMPT_LENGTH} characters se chhota rakhein.`,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing server-side GEMINI_API_KEY environment variable.");
    return response.status(503).json({
      error: "AI service abhi configured nahi hai. Kripya baad mein koshish karein.",
    });
  }

  const failures = [];
  for (const model of MODELS) {
    try {
      const answer = await generateAnswer(model, prompt, apiKey);
      return response.status(200).json({ answer });
    } catch (error) {
      console.error(`Gemini model request failed (${model}):`, error.message);
      failures.push(model);
    }
  }

  console.error("All configured Gemini/Gemma models failed:", failures.join(", "));
  return response.status(502).json({
    error: "AI se jawab nahi mil saka. Kuch der baad dobara koshish karein.",
  });
}
