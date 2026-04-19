🛡️ PhishGuard: AI Threat Intelligence Engine

PhishGuard is a client-side, AI-powered heuristic analysis tool designed to detect phishing attempts, social engineering tactics, and malicious payloads across URLs, SMS messages, Emails, and APK packages.

It leverages the Google Gemini 2.5 Flash model via native Structured Outputs (JSON Schema) to perform real-time threat matrix evaluations without requiring a traditional backend.

🚀 Live Demo

(You will put your GitHub Pages link here once we generate it in Step 4)

🧠 System Architecture

Input Parsing & Normalization: Extracts structural data from user inputs (URLs, headers, text tokens).

Heuristic Analysis: Cross-references data against 50+ threat vectors, including domain spoofing, urgency triggers, homograph attacks, and suspicious TLDs.

Strict JSON Matrix Generation: Utilizes Gemini's responseSchema to guarantee perfectly structured, parseable threat reports.

Client-Side Rendering: Dynamically paints a risk assessment UI with severity flags and actionable recommendations.

🛠️ Tech Stack

Frontend: HTML5, CSS3 (Custom Cyberpunk UI), Vanilla ES6 JavaScript

AI Integration: Google Gemini API (2.5 Flash)

Architecture: Object-Oriented JS, Async/Await Fetch API, Event Delegation

⚠️ Security Note for Developers

This repository contains a purely client-side implementation for portfolio demonstration purposes. In a production environment, the AI API calls and API keys must be abstracted behind a secure backend proxy (e.g., Node.js, Python FastAPI, or AWS Lambda) to prevent API key exposure.

👨‍💻 Author

Anand Kumar

B.Tech in AI & Data Science
