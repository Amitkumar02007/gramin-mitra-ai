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

The current demo calls Gemini 2.5 Flash directly from the browser using the
Google AI Studio API key entered into the form. The key is kept in memory for
the current page session and is not written to local storage or included in
the application bundle. The app requests a strict JSON response and renders
crop identification, local remedies, and government-scheme information.

### Configure AI access

1. Create a Google AI Studio API key and keep it private.
2. Enter the key in the app when prompted. It is sent to Google's API and is
   not saved by the app; the browser's network tools can still expose it to the
   person using that browser.
3. This direct-key demo is intended for individual evaluation. Do not publish
   or share a deployed instance with an embedded or shared key. For public
   production use, proxy requests through a rate-limited server-side endpoint
   and keep the provider key only in server-side environment variables (never
   a `VITE_` variable).
