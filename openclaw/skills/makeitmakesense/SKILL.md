---
name: makeitmakesense
description: Make It Make Sense — business document workspace for Series A/B teams; draft board/investor docs from workspace context, run cross-doc consistency scans, read the decision log.
---

# Make It Make Sense

Business document workspace for Series A/B teams. Drafts board memos, financial narratives, and SOPs grounded in real company metrics. Detects cross-doc metric conflicts and patches them.

## When to use this skill

- User wants a **draft** of a business document → use the workspace agent (natural-language task in `message`).
- User wants to **check** whether numbers or narrative conflict across docs → run a **consistency scan**.
- User wants the **audit trail** of edits → fetch the **decision log**.

## Tools (app integration)

These map to the **Make It Make Sense** Next.js API (local dev default `http://localhost:3000`). Calls require a **logged-in Supabase session** (cookie) unless you use a dev bridge.

| Intent | Method | Path |
|--------|--------|------|
| Draft / agent turn | `POST` | `/api/platform/agent` — body `{ "message": string, "docId"?: string, "conversationId"?: string }` |
| Consistency scan | `POST` | `/api/platform/consistency/run` |
| Decision log | `GET` | `/api/platform/decision-log` — optional `?docId=<uuid>` |

## Notes

- There is **no** `/api/platform/agent/autofill` in this codebase; use **`/api/platform/agent`** with a clear `message` (e.g. “Draft a board memo based on our workspace context.”).
- Prefer **`{baseDir}`** if you add scripts next to this file (OpenClaw convention).
