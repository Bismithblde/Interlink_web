# Matchmaking observability

Matchmaking, profile enrichment, and matchmaking-related Gemini requests emit newline-delimited JSON. Every record has `timestamp`, `level`, `service`, `operation`, `requestId`, `event`, and `stage` fields.

Set the detail level in `backend/.env`:

```env
MATCHMAKING_LOG_LEVEL=debug
```

`info` is the default and records stage summaries. `debug` adds every candidate's filter decision, schedule decision, ranking inputs, score components, exploration and fatigue adjustments, diversification choice, and every group decision. `warn`, `error`, and `off` are also supported.

The `/matchmaking/matches`, `/matchmaking/activity-suggestions`, and `/matchmaking/hangout-plans` responses include an `X-Matchmaking-Request-Id` header. Match responses also include the same ID in `requestId`. Search logs by that ID to reconstruct one request in order.

Important event families:

- `request.*`: HTTP receipt, validation, completion, and failure
- `dataset.*`: selected source, query counts, timing, and seeker schedule fallback
- `candidate.filter_evaluated`: exact filter acceptance or rejection reasons
- `candidate.schedule_rejected`: overlap values compared with the required cutoff
- `candidate.ranked`: all score components and formula inputs
- `candidate.diversification_selected`: raw and adjusted ranking at each output position
- `group.*`: combination generation, local semantic affinity, schedule rejection, and scoring
- `pipeline.*`: complete request outcome and counts
- `llm.*`: provider, model, timing, HTTP or JSON failure, token usage, and fallback outcome
- `tags.*` and `job.*`: enrichment guardrail results, persistence, retries, and stale jobs

Sensitive keys such as email, bio, profile snapshots, prompts, provider response text, credentials, and tokens are redacted by the shared logger. Long strings and large arrays are bounded to keep each record usable.

Example PowerShell filter for one request:

```powershell
npm run dev 2>&1 | Select-String 'YOUR-REQUEST-ID'
```
