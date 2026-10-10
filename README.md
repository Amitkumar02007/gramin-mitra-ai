# 🌾 Gramin-Mitra AI (ग्रामीण मित्र)

> **Empowering Rural Agriculture & Welfare with Google Gemma Open Architecture.**  
> Built for **Hacktoberfest Hack Day Ranchi 2026 × Hackerade**.

[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2026-orange?style=for-the-badge&logo=hacktoberfest)](https://hacktoberfest.com/)
[![Google Gemma](https://img.shields.io/badge/Model-Google_Gemma_4-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📌 Problem Statement

Over 65% of rural communities and farmers in India face two critical technological bottlenecks:
1. **Language & Complexity Gap:** Most government portals, advisory apps, and agritech tools use technical English or formal Hindi, making pest diagnostics and welfare schemes inaccessible.
2. **Connectivity & Latency Constraints:** Deep rural belts often have intermittent network access, where heavy cloud models fail to deliver timely guidance.

---

## 💡 Solution: Gramin-Mitra AI

**Gramin-Mitra AI** is a lightweight, edge-ready advisory engine powered by **Google Gemma open weights**. It allows farmers to describe crop symptoms, soil issues, or financial queries, delivering structured, vernacular (Hinglish) action plans:

* **Crop Disease & Pest Diagnosis:** Identifies leaf blight, pest infections, and physiological damage.
* **Affordable & Organic Remedies:** Recommends local, low-cost bio-fertilizers and organic alternatives (e.g., neem extract, bio-slurry).
* **Direct Scheme Eligibility:** Steps to apply for Kisan Credit Card (KCC), PM-Kisan, and crop insurance without bureaucratic jargon.

---

## 🏗️ Architecture

The browser calls the same-origin `/api/gemma` Vercel Function. The function
keeps the Google AI Studio credential server-side and tries Gemini 3.8 Flash
first, then the configured fallback models. Never use a `VITE_` prefix for
the provider key: Vite publishes `VITE_` variables in browser assets.

### Configure AI access

1. Create a Google AI Studio API key and keep it private.
2. In Vercel, open the project **Settings → Environment Variables** and add
   `GEMINI_API_KEY` for the environments you deploy to. Do not add the key as a
   `VITE_` variable or commit it to Git.
3. For local development, create an ignored `.env.local` file in the project
   root with `GEMINI_API_KEY=your_private_key`, then run `npx vercel dev` so
   both the Vite app and `/api/gemma` function are available locally.
4. Configure request rate limits for `/api/gemma` in your deployment platform
   before opening the demo to public traffic. The function is a public endpoint
   and an exposed provider key could otherwise be used to incur API charges.

The old browser API key is no longer used and the app clears the legacy
`GEMINI_API_KEY` localStorage entries when it starts.
