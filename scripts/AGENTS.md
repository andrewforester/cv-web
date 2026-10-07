# scripts

Helper scripts for the repo and hosting.

- `vercel-ignore.sh`: Vercel "Ignored Build Step" (`vercel.json` → `ignoreCommand`). Keeps the Hobby project under 100 deployments a day: `main` is deployed by CI, not by Vercel's Git integration (`git.deploymentEnabled.main: false`), `claude/*` session branches never get a preview, other branches skip docs-only pushes. Any doubt builds.
- `bootstrap.sh`: project bootstrap.
- `audit-pr.sh <P>`: the orchestrator's audit of a merged task PR (the process held: `Closes CV-N`, the last reviewer verdict is `Review passed` on the merged head, CI green). Needs `gh` and `jq`.
- `session-usage.sh <id> [label] [model]`: a local session's token usage, reviewer subagents included, as a row of the usage tables. Needs `jq`.
- `securityHeaders.ts`: the site's security headers (enforcing CSP, nosniff, referrer, permissions, frame). The voice agent adds the ElevenLabs/LiveKit origins to `connect-src` and `microphone=(self)` to the permissions. `vite.config.ts` serves them from `vite preview`; `vercel.json` → `headers` is its static copy, kept equal by `e2e/securityHeaders.spec.ts`. Change both together.
