const SYSTEM_INSTRUCTION = `Aap Gramin-Mitra AI (ग्रामीण मित्र) hain, Google Gemma 4 Open Architecture par aadharit kisan sahayak. Har jawab ko kisan ke poore sawal ke mutabik banayein. Sawal mein jis fasal ka naam ho (jaise gehun, dhaan, tamatar ya koi anya fasal), usi fasal ko pehchanein aur uske lakshan ke anusar jawab dein. Dhaan ko default na maanein aur sawal mein na di gayi fasal ya lakshan na ghadhein. Agar fasal ya lakshan spasht na hon, JSON mein zaroori spashtikaran maangein. Bimari ya yojana ki pakki jankari na ho to andaza lagane ke bajay yeh baat saaf batayein.

Yeh application offline edge-readiness ko dhyan mein rakhkar banaya gaya hai aur local rural kiosks par Ollama ya llama.cpp jaise runtime ke saath integrate kiya ja sakta hai. Is request mein jawab isi AI service ke madhyam se dein.

Response strictly ek valid JSON object ho. Koi markdown, code fence, heading ya JSON ke bahar text na dein. Sabhi keys aur string values double quotes mein hon, trailing comma na ho, aur JSON.parse se seedha parse ho sake. Is exact shape aur key names ka istemal karein:
{
  "greeting": "Aadar satkar sandesh",
  "crop": "Kisan ke sawal se pehchani gayi fasal; aspasht ho to sawal ka sandarbh",
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
Risk score 0 se 100 ke beech number ho. remedies aur government_schemes hamesha arrays hon. Upchaar ko pahchani gayi fasal aur samasya ke liye hi chunen; bina pakki pehchan ke dawa ki matra ya spray schedule na batayein. Yojana eligibility ya fayde ke baare mein pakka na hon to official source se jaanchne ko kahein.`;

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];
const MAX_PROMPT_LENGTH = 2000;
const SUPPORTED_LANGUAGES = new Set([
  "Hinglish (Mix)",
  "Hindi (हिन्दी)",
  "Bhojpuri (भोजपुरी)",
]);

async function generateAnswer(model, prompt, language, apiKey) {
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
          role: "user",
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}\n\nLanguage requirement: Respond strictly in ${language}.\n\nKisan ki poori query (crop context isi se identify karein): ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    const providerMessage =
      data?.error?.message || `Google AI API error (${response.status}).`;
    if (
      response.status === 400 &&
      /api key not valid|api_key_invalid|invalid api key/i.test(providerMessage)
    ) {
      const error = new Error(
        "Google AI Studio API key invalid ya disabled hai. Nayi active key paste karein, ya custom key field khaali karke server key use karein.",
      );
      error.code = "INVALID_API_KEY";
      throw error;
    }
    throw new Error(providerMessage);
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
  const requestedLanguage = request.body?.language ?? "Hinglish (Mix)";
  const language =
    typeof requestedLanguage === "string" &&
    SUPPORTED_LANGUAGES.has(requestedLanguage)
      ? requestedLanguage
      : null;

  if (!prompt) {
    return response.status(400).json({ error: "Kripya apna sawal likhein." });
  }
  if (!language) {
    return response.status(400).json({ error: "Kripya supported jawab ki bhasha chunein." });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return response.status(400).json({
      error: `Sawal ${MAX_PROMPT_LENGTH} characters se chhota rakhein.`,
    });
  }

  const suppliedApiKey =
    typeof request.body?.apiKey === "string" ? request.body.apiKey.trim() : "";
  if (suppliedApiKey.length > 512) {
    return response.status(400).json({ error: "API key format valid nahi hai." });
  }

  const apiKey = suppliedApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing server-side GEMINI_API_KEY environment variable.");
    return response.status(503).json({
      error: "AI service abhi configured nahi hai. Kripya baad mein koshish karein.",
    });
  }

  const failures = [];
  for (const model of MODELS) {
    try {
      const answer = await generateAnswer(model, prompt, language, apiKey);
      return response.status(200).json({ answer });
    } catch (error) {
      console.error(`Gemini model request failed (${model}):`, error.message);
      if (error.code === "INVALID_API_KEY") {
        return response.status(401).json({ error: error.message });
      }
      failures.push({ model, message: error.message });
    }
  }

  console.error(
    "All configured Gemini/Gemma models failed:",
    failures.map(({ model }) => model).join(", "),
  );
  return response.status(502).json({
    error:
      failures.at(-1)?.message ||
      "AI se jawab nahi mil saka. Kuch der baad dobara koshish karein.",
  });
}
