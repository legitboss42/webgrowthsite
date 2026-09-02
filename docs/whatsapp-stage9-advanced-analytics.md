# WhatsApp Stage 9 — Advanced Analytics

Status: DISCUSSED / READY FOR IMPLEMENTATION

Stage 9 upgrades the existing WhatsApp Analytics area from basic message/call reporting into a provider-grade operational and business intelligence workspace.

## Existing foundation to preserve

The current product already has basic analytics for:
- message volume
- sent vs received
- active conversations
- delivery funnel and delivered/read/failed rates
- first-response timing derived from stored messages
- activity series by day
- new-contact counts and lead-temperature mix
- WhatsApp call analytics
- 7 / 30 / 90 day range switching

Stage 9 must extend this implementation, not rebuild it.

## Stage 9 product areas

### 1. Executive overview
- total conversations
- new contacts/leads
- messages sent/received
- median first-response time
- open conversation backlog
- resolved/closed conversations
- campaign sends/replies where data exists
- automation success/failure rate
- Flow completion rate
- call answer/missed rate
- comparison against the previous equivalent period
- clear positive/negative/neutral trend indicators

No fake revenue, ROI or Meta billing metrics.

### 2. Conversation analytics
- conversations opened
- conversations closed
- reopened conversations where reliably derivable
- current open backlog
- inbound/outbound message volume
- median/average first-response time
- response target performance
- busiest day/time patterns
- drill-down to relevant conversations

### 3. Team / agent analytics
Use `whatsapp_team_activity`, conversation assignments and stored message history where reliable.

Include:
- assigned conversations per team member
- assignment activity
- active workload
- handled/closed conversation activity where attribution is reliable
- agent response-time metrics only when attribution can be proven from stored data
- team comparison table
- filter by team member

Do not attribute an outbound message to an agent unless the stored data proves who sent it.

### 4. CRM / lead analytics
Use `whatsapp_contacts` and stored CRM changes.

Include:
- contacts created
- lead-stage distribution
- lead-temperature distribution
- opt-in / opt-out distribution
- service-interest/tag distribution
- source distribution where populated
- lead funnel movement where event history permits accurate calculation
- drill-down to filtered contact views

Current-state counts must not be falsely presented as historical conversions.

### 5. Automation analytics
Use `whatsapp_automations`, `whatsapp_automation_runs` and `whatsapp_automation_events`.

Include:
- total runs
- queued/running/waiting/succeeded/failed/skipped/cancelled counts
- success rate
- failure rate
- average/median completion duration where timestamps permit
- runs by workflow
- runs by trigger type
- top failing workflows
- failing action index/event/error details
- recent failures with drill-down into run history
- filter by workflow, trigger and status

### 6. Campaign analytics
Use `whatsapp_campaigns`, `whatsapp_campaign_recipients` and campaign events.

Include where campaign data exists:
- audience
- eligible
- sent
- delivered
- read
- replied
- failed
- skipped
- delivery/read/reply/failure rates
- campaign comparison
- template used
- campaign timeline/status
- recipient failure reasons
- drill-down to campaign details

An empty campaign system should render a proper empty state, not fake zero-performance conclusions.

### 7. WhatsApp Flow analytics
Use `whatsapp_flows`, `whatsapp_flow_submissions` and `whatsapp_flow_events`.

Include:
- Flow launches
- completed submissions
- failed submissions
- currently incomplete/started submissions
- completion rate
- abandonment/incomplete rate where definition is explicit
- average completion duration where timestamps permit
- performance by Flow
- recent submissions
- drill-down to Flow/submission data

### 8. Call analytics integration
Preserve the existing call analytics implementation and integrate high-level call KPIs into the main analytics experience.

Include:
- inbound/outbound calls
- answered
- missed/unanswered where status supports it
- average duration
- total talk time
- call trend

### 9. Filters and navigation
Where practical support:
- 7 / 30 / 90 day periods
- custom date range if it can be implemented without expensive query patterns
- team member
- CRM lead stage
- service/tag
- automation
- campaign
- Flow

Analytics cards/tables should link back into the relevant operational screens whenever a useful drill-down exists.

## Data / architecture rules

1. Existing stored production data is the source of truth.
2. Never invent unavailable figures.
3. `null` / unavailable must remain visually distinct from zero.
4. Prefer bounded aggregate queries over loading unbounded raw data into Next.js.
5. Preserve zero-cost/free-tier infrastructure.
6. Add SQL views/functions/indexes or additive summary tables only when they materially improve correctness/performance.
7. Any new tables must have appropriate RLS and indexes.
8. Avoid storing duplicate personally identifiable data solely for analytics.
9. Historical trend claims require historical/event data, not only current row state.
10. Analytics must remain server-authorized according to WhatsApp workspace roles.

## UX direction for Stage 9

Stage 9 should improve analytics usability but must not perform the final global frontend redesign. The dedicated Stage 12 App Experience Redesign will unify the full product later.

For Stage 9:
- use the existing product design system
- avoid marketing-site style layouts
- favour compact operational dashboards
- use clear charts, tables and drill-downs
- ensure mobile remains usable
- do not add decorative charts with no decision value

## Production data sources confirmed before implementation

Relevant production sources currently include:
- `whatsapp_messages`
- `whatsapp_conversations`
- `whatsapp_contacts`
- `whatsapp_team_members`
- `whatsapp_team_activity`
- `whatsapp_automations`
- `whatsapp_automation_runs`
- `whatsapp_automation_events`
- `whatsapp_campaigns`
- `whatsapp_campaign_recipients`
- `whatsapp_campaign_events`
- `whatsapp_flows`
- `whatsapp_flow_submissions`
- `whatsapp_flow_events`
- `whatsapp_calls`

## Stage 9 completion gate

Stage 9 is complete only when:
1. existing message analytics still work;
2. existing call analytics still work;
3. overview KPIs are based on real stored data;
4. period comparisons are correct and tested;
5. automation analytics are live and drillable;
6. CRM/lead analytics are live without fake conversion claims;
7. campaign analytics handle both empty and populated campaign states;
8. Flow analytics handle started/completed/failed submissions correctly;
9. team analytics do not misattribute messages/actions;
10. filters and range switching work on desktop and mobile;
11. high-volume queries are bounded and appropriate indexes exist;
12. no new blocking Supabase security/performance advisories are introduced;
13. no new blocking Vercel production errors are introduced;
14. Owner production test passes;
15. Stages 1–8 receive a regression smoke test before Stage 10 unlocks.

## Deferred item

The Web Growth project-enquiry Flow completion automation discussed after Stage 8 remains deliberately deferred. It is not part of the Stage 9 completion gate unless the user explicitly reopens that scope.
