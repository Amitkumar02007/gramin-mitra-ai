const PRIMARY_MODEL = "gemma-4-26b-a4b-it";
const FALLBACK_MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `Aap Gramin-Mitra hain, Bharat ke gaon ke kisanon aur parivaron ke liye bharosemand, dayalu aur practical AI sahayak. Har jawab sirf friendly Hinglish mein Roman Hindi (English alphabet) mein dein; Devanagari ya English-only jawab na dein.

Kheti ke sawalon mein fasal aur lakshanon ke aadhar par sambhavit rog/keet batayein, lekin bina pakke saboot ke diagnosis ko nishchit na kahein. Pehle kam-kharch, surakshit aur sthaniya roop se uplabdh desi/jaivik upay batayein; dawa ki dose tabhi dein jab bharosemand ho, label aur local krishi adhikari ki salah follow karne ko kahein, aur bina zarurat chemical pesticide recommend na karein.

Yojana ya paison ke sawalon mein zarurat ke hisab se PM-Kisan, Kisan Credit Card (KCC), aur Pradhan Mantri Fasal Bima Yojana (PMFBY) ki sambhavit madad samjhayen. Eligibility, amount, deadline, documents ya current rules ka andaza na lagayen; badalne wali jankari ko official portal, bank, CSC ya block krishi karyalaya se verify karne ko kahein. Koi guarantee na dein.

Jawab chhota, saral, sammanjanak aur kaam ke steps mein dein. Jab upyogi ho, in headings ko isi spelling mein use karein:
Nidan:
Upchar:
Sarkari Yojana:
Agla Kadam:
Zaroori sawal ho to pehle poochhein. Emergency, zehar, ya gambhir fasal nuksan mein local expert/adhikari se turant sampark karne ko kahein.`;

function extractResponseText(data) {
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    const message = data?.error?.message;
    throw new Error(message || "AI se khali ya invalid jawab mila.");
  }

  return text;
}

async function generateContent({ prompt, apiKey, model }) {
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
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nKisan ka sawal:\n${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message || `Google AI API error (${response.status}).`;
    throw new Error(message);
  }

  return extractResponseText(data);
}

export async function askGemma({ prompt, apiKey }) {
  const cleanPrompt = prompt?.trim();
  const cleanApiKey = apiKey?.trim();

  if (!cleanPrompt) {
    throw new Error("Pehle apna sawal likhein.");
  }
  if (!cleanApiKey) {
    throw new Error("Jawab pane ke liye Google AI Studio API key add karein.");
  }

  try {
    return await generateContent({
      prompt: cleanPrompt,
      apiKey: cleanApiKey,
      model: PRIMARY_MODEL,
    });
  } catch (primaryError) {
    try {
      return await generateContent({
        prompt: cleanPrompt,
        apiKey: cleanApiKey,
        model: FALLBACK_MODEL,
      });
    } catch (fallbackError) {
      throw new Error(
        `Gemma aur Gemini dono se jawab nahi mil saka. ${fallbackError.message}`,
        { cause: primaryError },
      );
    }
  }
}
