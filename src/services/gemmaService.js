export async function askGemma({ prompt } = {}) {
  const cleanPrompt = prompt?.trim();

  if (!cleanPrompt) {
    throw new Error("Kripya kisan bhai apni samasya likhein ya select karein.");
  }

  const response = await fetch("/api/gemma", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: cleanPrompt }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error || "AI se jawab nahi mil saka. Kuch der baad dobara koshish karein.",
    );
  }

  if (typeof data?.answer !== "string" || !data.answer.trim()) {
    throw new Error("AI se khali ya invalid jawab mila.");
  }

  return data.answer.trim();
}
