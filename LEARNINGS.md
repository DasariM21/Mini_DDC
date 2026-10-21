# What I learned

After each phase, the Agent asks the developer for one useful learning and records it briefly.

- **Planning:**
- Start by isolating pure detection/classification functions; this keeps milestone scope tight and testable before any platform features.
- **Detection:**
- Regex-only matching is not enough for quality: add validators (NINO prefix rules, Luhn, plausibility checks) to reduce false positives.
- Run the complete synthetic fixture matrix: it caught lowercase NINO and cross-detector overlap issues that smaller detector tests missed.
- **Security/persistence:**
- Returning masked examples at aggregation boundaries helps enforce no-raw-output behavior early, before storage/export work exists.
- Verify actual HTTP responses for raw-content echoes; never rely only on the pure classifier's return shape.
- **UI:**
- Not in scope for Milestone 1.
- Local auth route checks prove redirect/denial behavior, not that hosted Supabase signup, email confirmation, login, or RLS work. Keep migration application and two-user isolation tests as explicit live-environment gates.
- **Testing/deployment:**
- Keep real failure/retest evidence. Switching from Vitest to Node built-in tests avoided `vite/esbuild` install instability in this environment.
- Separate production dependency audit from the full dev-tool audit; don't force a major dependency downgrade to silence dev-only findings.
- **What I'd do differently:**
- If Git setup is expected for evidence, initialize/check repository prerequisites before coding to avoid end-of-task reporting gaps.
