# Dicky News Design Studio Professional

Separate visual website editor. It must not modify the customer production site, customer API, or ULTIMATE processing engine.

## Protected behavior
Existing element IDs, event handlers, API contracts and workflows must be preserved. New controls are visual-only until explicitly connected and tested. Production deployment requires a reviewed diff, staging validation and explicit approval.

## Product modules
Visual Editor; Precision Layout; Navigation Studio; Animation Studio; Component Library; Responsive Studio; Media Studio; HTML/CSS/JS Inspector; Indonesian AI Design Assistant; Page & CMS Manager; SEO & Accessibility; Performance Analyzer; Version Control; GitHub Deployment Manager; Project & Team Manager.

## Development setup
1. Node.js 20+.
2. Copy .env.example to .env and set a random STUDIO_SESSION_SECRET.
3. For GitHub Pages private-repository login, create a GitHub App once in GitHub Developer Settings. Enable Device Flow, set repository permissions `Contents: Read-only` and `Metadata: Read-only`, install it only on the repositories Studio should open, then put the App OAuth Client ID in `GITHUB_OAUTH_CLIENT_ID` inside `index.html`. The device flow uses no client secret; access tokens remain in tab memory. Do not use an OAuth App with broad `repo` write scope.
4. Run npm start and open http://127.0.0.1:8787.
5. Run npm run check and npm test.

## Backend foundation
GitHub OAuth callback, server-side sessions, repository listing, project persistence, snapshots/restore and a GitHub contents commit endpoint. Project JSON is stored under the configured STUDIO_DATA_DIR. Mutating API requests require a same-origin Origin header.

## Production hardening still required
Use HTTPS and secure cookie handling at the reverse proxy, persistent database/object storage, rate limiting, audit logging, encrypted token/session storage, OAuth scope minimization and tested authorization. AI execution, multi-file asset rewriting, full CMS, real-time collaboration, PR/staging orchestration, media transformations and automated Core Web Vitals require dedicated provider/infrastructure integrations. Do not claim these integrations are production-ready until tested.
