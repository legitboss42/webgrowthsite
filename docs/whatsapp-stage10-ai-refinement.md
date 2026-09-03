# WhatsApp Stage 10 AI refinement

This refinement keeps the Stage 10 AI safety boundary while reshaping the product around the way businesses actually configure AI team members.

## Product structure

`Automations` is the parent workspace for intelligent/rule-based operations:

- **Workflows** — the existing visual automation engine and run history.
- **AI Agents** — Agent objectives, instructions, Knowledge Base, approvals, testing, usage and AI runtime settings.

Workspace-wide AI controls also appear under **Settings → AI & automation**. Provider/model details are intentionally hidden from ordinary product controls; Web Growth owns the routing layer.

## AI orchestration

The platform continues to use Vercel AI Gateway internally, but selects a suitable priced language model from the live Gateway catalogue instead of exposing a hard-coded model picker to clients.

Billing modes:

- `DISABLED` — no model calls.
- `FREE_ONLY` — verifies the Gateway credit balance before every request, estimates the maximum primary-route cost, reserves a configurable safety floor and fails closed if credits cannot be verified. Model fallbacks are disabled in this mode so a cheap route cannot silently fall back to a more expensive model.
- `BUDGET_CAPPED` — enforces the workspace monthly spend cap and may use automatic Gateway fallbacks.

Daily request limits, output-token ceilings and autonomous-turn ceilings remain enforced.

## Instructions and objectives

Instruction priority is:

1. Platform safety rules.
2. Workspace-wide Business AI Instructions.
3. Individual AI Agent instructions.
4. Approved Knowledge Base content.
5. CRM/conversation context.
6. The customer message.

Each Agent can define:

- role and tone
- objective
- required information fields
- what happens when the objective completes
- instructions
- strict/balanced/flexible uncertainty behaviour
- selected knowledge sources
- maximum turns and fallback message

Templates are available for Receptionist, Sales Qualifier, Customer Support and Custom Agents.

## Action safety

Every supported action has one of three policies per Agent:

- `AUTO` — trusted server code may execute the action.
- `APPROVAL` — the proposal is persisted and waits for Owner/Manager approval.
- `NEVER` — the model cannot execute the action.

The approval queue lives under **Automations → AI Agents → Approvals**. The model still only proposes structured allow-listed actions; trusted server code performs them.

## Knowledge Base

Workspace-scoped sources support:

- approved pasted text
- structured FAQ entries
- public webpage text import
- text documents: TXT, Markdown, CSV, JSON, HTML and XML

Sources are chunked and retrieved with PostgreSQL full-text search, so the initial system does not require a paid embeddings/vector service.

Stage 11 tenant isolation is enforced at the database search boundary by the new `search_whatsapp_ai_knowledge_scoped` RPC. The refined runtime cannot perform an unscoped knowledge search even when an Agent has no explicit source IDs.

## Testing and observability

The Agent playground is multi-turn and non-mutating. It shows:

- reply
- knowledge sources used
- collected objective fields
- objective completion state
- proposed actions and their policies
- internal selected model route
- input/output tokens
- estimated cost
- latency

Live AI run metadata also records source provenance, objective state, handoffs, action counts and latency.

## Conversation AI Assist

AI Assist remains human-controlled and never auto-sends a generated draft. Available transformations include draft reply, shorter, friendlier, professional, simplify, grammar correction, persuasive, empathetic, translation and summary. The previous duplicate composer-injection call is removed.

## Deployment discipline

This refinement is built and validated as one batch. Vercel is not used as a development loop. Production promotion happens only after the full GitHub build, database migration, tenant checks and Supabase advisors are green. If Vercel's existing daily deployment quota is still exhausted, that external quota is the only permitted remaining deployment gate.
