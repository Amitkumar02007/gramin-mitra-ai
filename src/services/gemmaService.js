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

async function requestAnswer(model, prompt, apiKey) {
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
    throw new Error(
      data?.error?.message || `Google AI API error (${response.status}).`,
    );
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

export async function askGemma({ prompt, apiKey } = {}) {
  const cleanApiKey = apiKey?.trim();
  const cleanPrompt = prompt?.trim();

  if (!cleanApiKey) {
    throw new Error("Pehle apni Google AI Studio API key enter karein.");
  }
  if (!cleanPrompt) {
    throw new Error("Kripya kisan bhai apni samasya likhein ya select karein.");
  }

  const models = [
    "gemini-3.8-flash",
    "gemma-4-26b-a4b-it",
    "gemini-2.5-flash",
  ];
  const failures = [];

  for (const model of models) {
    try {
      return await requestAnswer(model, cleanPrompt, cleanApiKey);
    } catch (error) {
      failures.push(`${model}: ${error.message}`);
      if (model !== models[models.length - 1]) {
        console.warn(`Model ${model} failed; trying the next fallback.`, error);
      }
    }
  }

  throw new Error(
    `Gemma 4 / Gemini Flash models se jawab nahi mil saka. ${failures.join(" | ")}`,
  );
}
