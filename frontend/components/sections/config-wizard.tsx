// Alright — if I’m stepping in as a senior engineer, I’m ignoring UI first and locking the system design + data flow, because Datadis integrations fail when people start with forms instead of the data pipeline.

// Here’s exactly how I’d set this up.

// 🧠 1. Core decision: what you are building

// You are building:

// A per-user delegated data ingestion system over Datadis

// Not:

// a CRUD onboarding form system
// not a “home management app”

// This changes everything.

// 🧱 2. System architecture (minimal but correct)

// You need 4 backend concepts:

// 1. User

// Your app identity

// 2. DatadisSession

// Represents the user’s authenticated access to Datadis

// 3. SupplyPoint (CUPS)

// Raw data from Datadis

// 4. Home (your abstraction)

// UI/product layer over SupplyPoints

// 🔐 3. Authentication flow (critical path)

// Each user must go through:

// Step A — user enters Datadis credentials
// username
// password
// Step B — backend calls:
// authenticate(username, password)
// Step C — backend stores:
// session token (or equivalent)
// expiry metadata
// userId ↔ Datadis session mapping

// 👉 THIS is your most sensitive data in the system

// 📡 4. Immediately after auth: data hydration

// Once authenticated, you DO NOT ask the user anything else yet.

// You run:

// getSupplies()

// This returns:

// list of CUPS
// addresses
// distributor info
// 🏠 5. Transform Datadis data → your domain model

// This is where most systems get messy.

// You map:

// SupplyPoint (Datadis)
//     ↓
// Home (your system)

// Rule:

// 1 CUPS = 1 Home (usually)
// user can rename it
// user cannot define it manually (long term)
// 🧭 6. Onboarding flow (correct version)

// Forget multi-input wizard. The real flow is:

// Step 1 — User account
// email
// password
// Step 2 — Consent
// GDPR + “access energy data via Datadis”
// Step 3 — Connect Datadis

// Backend call:

// authenticate()

// If success:
// → continue

// If failure:
// → stop onboarding

// Step 4 — Auto-discovery
// getSupplies()

// System result:

// list of CUPS

// You show UI:

// “We found 2 supply points”
// Step 5 — Home confirmation layer (UI only)

// User can:

// rename “CUPS 1 → Madrid Apartment”
// optionally hide irrelevant ones

// But NOT create new ones

// Step 6 — Finish onboarding

// Persist:

// Homes
// CUPS mapping
// Datadis session reference

// Trigger:

// initial consumption sync job
// 🔄 7. Sync system (this is the real product)

// After onboarding, everything becomes background jobs:

// For each user:
// for each Home/CUPS:
//     fetch consumption
//     store time series

// Run:

// scheduled (cron/queue)
// or incremental sync
// 🗄️ 8. Database design (minimum viable correct schema)

// You need:

// users
// id
// email
// password_hash
// datadis_sessions
// user_id
// token
// expires_at
// refresh info (if exists)
// supply_points
// user_id
// cups
// address
// distributor
// raw_datadis_payload
// homes
// user_id
// supply_point_id
// label
// consumption_records
// cups
// timestamp
// kwh
// raw payload
// ⚠️ 9. Key engineering rules (don’t skip this)
// Rule 1: Datadis is not your source of truth

// It is an external dependency.

// Rule 2: CUPS is the atomic unit

// Everything maps to it.

// Rule 3: Never trust onboarding input for energy data

// Always overwrite/confirm from Datadis.

// Rule 4: Sessions will expire

// You must handle:

// re-auth
// retry logic
// sync failure recovery
// 🧠 10. What your frontend should actually do

// Your wizard is NOT:

// “collect home data”

// It is:

// “initiate external authorization + display imported entities”

// So frontend steps become:

// Login
// Connect Datadis
// Loading state (sync)
// Review imported homes
// Finish
// 🚀 11. The real “happy path”

// If everything works perfectly:

// User signs up
// → connects Datadis
// → system fetches CUPS automatically
// → homes appear instantly
// → consumption sync starts
// → dashboard is already populated

// No manual energy setup. That’s the goal.

// 💣 Final senior-level truth

// If you design this as a form-first onboarding:

// you’ll fight Datadis forever
// you’ll get bad mappings
// users will see missing data
// support load increases

// If you design it as a data ingestion pipeline with a UI on top:

// onboarding becomes trivial
// system scales cleanly
// data quality stays high

export default function ConfigWizard() {
  return <div>Work In progress</div>;
}
