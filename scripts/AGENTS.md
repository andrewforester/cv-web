# scripts

Helper scripts for the repo and hosting.

- `vercel-ignore.sh`: Vercel "Ignored Build Step" (`vercel.json` → `ignoreCommand`). Keeps the Hobby project under 100 deployments a day: `main` always builds, `claude/*` session branches never get a preview, other branches skip docs-only pushes. Any doubt builds.
- `bootstrap.sh`: project bootstrap.
