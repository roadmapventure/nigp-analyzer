# NIGP Agent Configs — Implementation Package

## What's in this package

```
api/
  agent-configs.js      NEW — CRUD for role_prompt, output_format, guardrail
  brief.js              MODIFIED — assembles 5-layer prompt from agent_configs

src/
  PersonnelScreen.jsx   NEW — full tabbed Personnel screen (replaces old PersonnelScreen)
  TeamBuilder.jsx       MODIFIED — imports PersonnelScreen, removes old inline version
  App.jsx               MODIFIED — sessionConfigs state + analysis-side config selectors

supabase-migration.sql  NEW — create table + seed data for all agents
README.md               This file
```

---

## Setup order

### 1. Supabase — run migration

Open your Supabase project → SQL Editor → paste and run `supabase-migration.sql`.

This creates the `agent_configs` table and seeds default role prompts, output formats,
and guardrails for Bob, Robyn, Mike, and Chloe.

### 2. Deploy API files

Copy `api/agent-configs.js` and `api/brief.js` into your project's `api/` directory,
replacing the existing `brief.js`.

Both files use the same env vars already in your project:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ALLOWED_ORIGIN`
- `VERCEL_URL` (used by brief.js to call rag-query internally — set automatically on Vercel)

### 3. Update frontend files

Copy `src/PersonnelScreen.jsx` and `src/TeamBuilder.jsx` into your `src/` directory.
Copy `src/App.jsx` into your `src/` directory.

`TeamBuilder.jsx` now imports `PersonnelScreen` from `./PersonnelScreen`.
Make sure both files are in the same `src/` directory.

### 4. Deploy

```bash
git pull --rebase
# copy files as above
git add src/PersonnelScreen.jsx src/TeamBuilder.jsx src/App.jsx api/agent-configs.js api/brief.js
git commit -m "feat: agent configs - 5-layer prompt assembly, tabbed personnel screen"
git push
```

Vercel auto-deploys.

---

## What's now functional vs. static

### FUNCTIONAL (live API calls)
- **Resume tab** — loads/saves/deletes role prompts from Supabase; Set Default and User Selectable toggles work
- **Playbook tab** — loads/saves/deletes output formats; Save Guardrails button persists to Supabase
- **Training tab → Add Training** — full teach flow with file upload, metadata AI-generation, /api/ingest (unchanged from existing)
- **Training tab → Test Agent** — live BeeHive scenario test with full 5-layer prompt assembly, RAG query, real Anthropic API call; Role Prompt and Output Format selectors load from Supabase
- **AI Review (App.jsx)** — when an agent has user-selectable configs, dropdowns appear above the Generate button; selection persists for the session
- **brief.js** — now assembles Layer 01 (role) + Layer 02 (RAG) + Layer 04 (format) + Layer 05 (guardrails) from Supabase before calling Anthropic

### STATIC (visual only — future versions)
- Agent Readiness Score and all layer readiness bars
- Situational Awareness bar
- Intelligence Configuration assembly diagram
- Skill Ladder "X more documents to promote" note
- Projected Impact (Before/After skill)
- What Changes panel LIVE badges
- Onboarding Checklist steps 3–6 (Chunked, Indexed, Quality Check, Available)
- Reports Run count
- Compensation / Ledger
- Assignments tab (entire tab)
- Completed Projects tab (entire tab)
- Report Comparison delta panel (only appears in full team test with 2 agents)

---

## Schema notes

The `agent_configs` table is designed for future admin "assign to multiple agents" without restructuring:
- Add a junction table `agent_config_assignments(config_id, agent_id)` when needed
- The `is_user_selectable` flag controls analysis-side visibility per config, per agent
- `is_default` is enforced at the application layer (PATCH atomically clears others of same type+agent)

All configs are scoped by `tenant_id` — currently hardcoded to `"global"`.
Multi-tenant support requires passing tenant_id from auth context.
