const SYSTEM_INSTRUCTION = `Aap Gramin-Mitra AI hain, ek rural development aur kisan sahayak assistant powered by Google Gemma open architecture.
Aapko gaon ke kisan ke liye aasan Hinglish (Hindi written in Roman script) me step-by-step practical jawab dena hai:
1. 🔍 Samasya / Bimari ki pehchan
2. 🌿 Sasta ya Desi Samadhan / Upchaar (kam kharche wala)
3. 🏛️ Sarkari Yojana / Sahayata (PM-Kisan, KCC, Fasal Bima)
Jawab bilkul practical, simple aur bullet points me rakhein.`;

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

  try {
    return await requestAnswer(
      "gemma-4-26b-a4b-it",
      cleanPrompt,
      cleanApiKey,
    );
  } catch (primaryError) {
    console.warn("Gemma endpoint fallback triggered", primaryError);
  }

  try {
    return await requestAnswer(
      "gemini-2.5-flash",
      cleanPrompt,
      cleanApiKey,
    );
  } catch (fallbackError) {
    throw new Error(
      `Gemma aur Gemini dono se jawab nahi mil saka. ${fallbackError.message}`,
      { cause: fallbackError },
    );
  }
}
