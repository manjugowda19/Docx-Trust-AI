DocxTrust AI
DocxTrust is an evidence-first claim verification platform. It researches submitted claims against live web sources, returns a reasoned verdict, and preserves human review decisions and an audit trail.

Live application: https://docxtrust-i8vcxl.v2.appdeploy.ai/
Repository: https://github.com/mallikarjun1507gouda-blip/DocxTrust-AI

What it does
Claim verification: Submit a factual claim and optional context for live web research.
Evidence-backed outcomes: Returns one of VERIFIED, BLOCKED, or NEEDS_REVIEW, with an explanation, analysis, and source links.
Primary and backup research providers: Gemini with Google Search grounding is configured as the primary provider. Groq GPT-OSS 20B with Browser Search is the automatic backup when Gemini is unavailable or returns no usable grounding sources.
Evidence library: Store, view, and delete supporting source passages.
Human review: Record a reviewer decision and reason without overwriting the original AI assessment.
Audit trail: Keep a record of evidence and verification events.
Demo mode: Explore prepared examples clearly labelled as simulations; demo results are not saved as live verifications.
Technology
TypeScript
Vite
HTML and CSS
AppDeploy SDK and managed database
Gemini API with Google Search grounding
Groq API with GPT-OSS 20B and Browser Search
Architecture overview
The frontend in src/ provides the workspace and calls the backend API. The backend in backend/index.ts handles evidence, verification, human review, dashboard statistics, and audit events. AppDeploy provides the hosted runtime, managed database, and encrypted secret storage.

Configuration and secrets
The deployed AppDeploy application uses these secret names:

GOOGLE_GEMINI_API_KEY
GROQ_API_KEY
Configure keys through the AppDeploy secrets manager. Never commit API keys, access tokens, or a local .env file to GitHub. The repository intentionally excludes secret values.

Important verification note
The app requires usable live web sources before it saves a verification. If research is incomplete, conflicting, or inconclusive, the correct outcome is NEEDS_REVIEW. Demo mode is illustrative only and must not be presented as a live verification.

Gemini is configured as the primary provider; its availability depends on the Google API project's quota and service status. Groq is configured as the backup provider.

Source layout
backend/
  index.ts
  realtime-subscribers.ts
  realtime.ts
src/
  main.ts
  styles.css
index.html
package.json
postcss.config.js
tailwind.config.js
tsconfig.json
vite.config.ts
tests/
  tests.json
Deployment
The production app is deployed through AppDeploy. To update the hosted version, use the existing AppDeploy application DocxTrust rather than creating a duplicate app. Keep provider keys in AppDeploy's encrypted secrets manager.

License
No license has been assigned yet. All rights reserved unless a license is added to this repository.