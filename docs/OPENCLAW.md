# OpenClaw + DocFin

This branch adds the **`docfin`** OpenClaw skill under `openclaw/skills/docfin/`. It calls your local Next.js app’s platform APIs (`/api/platform/agent`, consistency, decision log). **No secrets live in the skill** — use environment variables and `~/.openclaw/openclaw.json` on each machine.

The **`main`** line of this repo already includes those HTTP routes; this branch only adds the **OpenClaw integration** (skill + docs). In-app workspace UI and extended agent work live on the **`Agent`** branch.

## What to copy where

1. **Skill folder** (from this repo) → OpenClaw workspace, e.g.  
   `~/.openclaw/workspace/skills/docfin/`  
   (same layout: `SKILL.md`, `docfin.js`.)

2. **Next.js app** — run `npm run dev` (default `http://localhost:3000`) when the skill should hit your APIs.

3. **Supabase session** — authenticated API routes expect a **browser session cookie**. Set one of:
   - `DOCFIN_COOKIE` — full `Cookie` header value after you sign in (DevTools → Application → Cookies, or Network → request headers).
   - Legacy aliases: `MAKEITMAKESENSE_COOKIE`, `RONTZEN_COOKIE` (same shape; supported by `docfin.js` for migration).

4. **Base URL** (optional) — `DOCFIN_BASE_URL` (default `http://localhost:3000`). Legacy: `MAKEITMAKESENSE_BASE_URL`.

5. **OpenClaw config** — in `~/.openclaw/openclaw.json`, under the skill entry for `docfin`, set `env` for the variables above. **Do not** commit that file; it is machine-local.

## OpenClaw + Discord (local gateway)

- **Gateway:** `openclaw daemon start` (or `restart`). After start, wait **~30–60s**, then `openclaw gateway probe` until **RPC: ok**.
- **LLM:** OpenClaw’s embedded agent often uses **Ollama** (e.g. `qwen3:4b`). If `ollama run …` hangs, fix Ollama before debugging Discord.
- **Discord:** Bot **token** from Developer Portal → **Bot** (not an OAuth URL). Enable **Message Content Intent** (and save). See also [OpenClaw troubleshooting](https://docs.openclaw.ai/troubleshooting).

## API map (skill → app)

| Intent | Method | Path |
|--------|--------|------|
| Agent turn | `POST` | `/api/platform/agent` |
| Consistency scan | `POST` | `/api/platform/consistency/run` |
| Decision log | `GET` | `/api/platform/decision-log` |

## Related branch

- **`Agent`** — cloud workspace agent rail, extra migrations, and deeper product docs for that line of work.
