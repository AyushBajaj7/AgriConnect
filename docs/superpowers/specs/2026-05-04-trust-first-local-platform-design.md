# AgriConnect Trust-First Local Platform Design

## Scope

AgriConnect should be honest about data freshness, usable by public users, and runnable without SQL, MongoDB, or outsourced database services. The system will use local structured files for users, cache data, review logs, and system status.

## Data Truth

Government schemes are a reviewed reference directory, not a real-time tracker. Each scheme should expose official source links, review metadata, and plain-language summaries. The site should periodically check official links and flag records for review instead of pretending it can infer every government update automatically.

Mandi prices are live only when the upstream government API returns usable records. When live fetch succeeds, the backend stores a local cache with the exact fetch timestamp. When the source fails, the UI should show the last successful live cache as stale. If no cache exists, it should show curated reference prices and label them clearly.

## Local Persistence

Use a structured local data directory:

- `backend/data/users/users.json` for registered users and roles.
- `backend/data/prices/latest-live.json` for the last successful live mandi response.
- `backend/data/schemes/review-log.json` for scheme link-check and review history.
- `backend/data/system/status.json` for service health snapshots.

All local file writes should be atomic enough for development and pilot use, with safe defaults when files are missing.

## Auth

Public registration is allowed. User records store password hashes only, role, active status, and timestamps. Roles are `admin` and `user`. Sessions remain cookie-based. Login and registration must be rate-limited and validate usernames and passwords in plain language.

## Chatbot

Keep Gemini as the primary provider because it has been verified to work. Add a deterministic local fallback for common agriculture questions when Gemini is missing, timed out, rate-limited, or unavailable. The chatbot UI should use plain, confidence-building copy and never crash the page on provider failure.

## User Experience

The dashboard, schemes, prices, and chatbot must avoid short forms as primary labels. Use full labels such as `Government schemes`, `Market prices`, `Farming tools`, and `Weather updates`. If a data source is stale, reference-only, or unavailable, say that clearly with timestamps where available.

## Verification

Before completion, verify registration, login, logout, session persistence, dashboard layout, scheme search and detail pages, mandi live/stale/reference states, chatbot response and fallback paths, weather page, tools page, build success, and browser behavior.
