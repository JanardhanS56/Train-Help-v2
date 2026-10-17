# Security Policy

## 🛡️ Reporting a Vulnerability

The TravelRescue AI team takes application security and user data protection seriously. If you discover a vulnerability or accidental credential exposure in this repository, please disclose it responsibly.

- **Do NOT file a public issue** on GitHub for suspected vulnerabilities, leaked keys, or sensitive exploits.
- **Reporting Contact**: Send an email to `security@travelrescue.local` (or reach out privately to the repository maintainer).
- **Include**:
  - Description of the issue or exposure
  - Steps to reproduce or proof-of-concept
  - Affected files, endpoints, or commits
  - Any suggested remediation

You will receive an initial response within 48 hours, followed by status updates as the fix is validated and deployed.

---

## 🔑 Environment Variables & Secret Categorization

Every environment variable utilized by TravelRescue AI falls into one of three strict tiers:

| Variable | Scope | Purpose | Required in Prod? | Sensitivity |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Supabase project endpoint | **Yes** | Low (Publicly identifiable) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Anonymous client JWT for RLS | **Yes** | Low-Medium (Protected by RLS) |
| `NEXT_PUBLIC_APP_URL` | Public (Client + Server) | Canonical app origin / Referer | Optional (defaults localhost) | Low (Public URL) |
| `REDIS_URL` | Server-Only | Upstash / Redis connection string | **Yes** (Rate limiter fails closed) | **High (Secret)** |
| `AI_PROVIDER` | Server-Only | Active AI provider (`groq`, etc.) | Optional (defaults `groq`) | Low |
| `AI_API_KEY` | Server-Only | Primary LLM provider API key | Recommended | **High (Secret)** |
| `AI_MODEL` | Server-Only | Primary LLM model identifier | Optional | Low |
| `AI_BASE_URL` | Server-Only | Custom OpenAI-compatible base URL | Optional | Low |
| `DEEPSEEK_API_KEY` | Server-Only | Direct DeepSeek API key | Optional | **High (Secret)** |
| `DEEPSEEK_MODEL` | Server-Only | DeepSeek model identifier | Optional | Low |
| `DEEPSEEK_BASE_URL` | Server-Only | DeepSeek API base endpoint | Optional | Low |
| `SUPABASE_SERVICE_ROLE_KEY` | **Local Scripts Only** | DB seed / admin scripts | **NEVER in production** | **CRITICAL (Bypasses RLS)** |
| `SUPABASE_DB_URL` | **Local Scripts Only** | Direct Postgres connection URL | **NEVER in production** | **CRITICAL (Direct DB access)** |

### ⚠️ Critical Rules:
1. **Never prefix secrets with `NEXT_PUBLIC_`**: Next.js automatically bundles any variable prefixed with `NEXT_PUBLIC_` into public JavaScript files served to every browser visitor. Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL` may carry this prefix.
2. **`SUPABASE_SERVICE_ROLE_KEY` is strictly for local developer scripts**: Never enter this key into Vercel, Netlify, or any production hosting provider dashboard. It bypasses all database Row Level Security.
3. **`REDIS_URL` is required in production**: The distributed sliding-window rate limiter fails closed (HTTP 503) if Redis is unreachable in production mode.

---

## 🚫 Secret Hygiene: Never Commit `.env*` Files

- **`git` ignores secrets**: `.env.local`, `.env.*.local`, `.env`, and private key files (`*.pem`, `*.key`) are included in `.gitignore` and must never be committed.
- **`.env.example` contains placeholders only**: Only checked-in template files with dummy placeholders (e.g. `YOUR-PROJECT-REF`, `YOUR-PASSWORD`) and empty keys are permitted in git.
- **Local secret scanning**: Run `npm run check:secrets` before committing to scan tracked files against regex signatures for JWT tokens, service role keys, postgres passwords, private keys, and AI provider credentials.
- **Automated CI scanning**: GitHub Actions enforces both `npm run check:secrets` and official `gitleaks` scanning on all Pull Requests and pushes to `main`.

---

## 🔄 Secret Rotation Procedures

If any key or credential is suspected of being compromised or accidentally committed, follow these rotation procedures immediately:

### 1. Rotating Supabase Credentials
1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Project Settings** > **API**.
3. Under **JWT Settings**, click **Generate new JWT secret** (or roll your API keys).
4. Note that changing the JWT secret invalidates all existing user sessions and immediately breaks old `anon` and service role keys.
5. Copy the newly generated `anon` key and `SUPABASE_SERVICE_ROLE_KEY` into your `.env.local`.
6. Update the environment variables in your deployment dashboard (e.g. Vercel).

### 2. Rotating Direct Postgres Database Password
1. Navigate to **Project Settings** > **Database**.
2. Scroll to **Database password** and click **Reset database password**.
3. Set a strong password (at least 20 random alphanumeric + special characters).
4. Update `SUPABASE_DB_URL` in `.env.local`.

### 3. Rotating AI Provider API Keys
1. **Groq**: Go to [Groq Console](https://console.groq.com/keys) -> Delete old key -> Create new key.
2. **DeepSeek**: Go to [DeepSeek Platform](https://platform.deepseek.com/api_keys) -> Delete old key -> Create new API key.
3. Update `AI_API_KEY` or `DEEPSEEK_API_KEY` in `.env.local` and your production deployment provider.

### 4. Rotating Redis Connection URL
1. Open [Upstash Console](https://console.upstash.com/).
2. Select your Redis database -> Go to **Details** -> **Security**.
3. Click **Reset Password** / **Rotate Token**.
4. Update `REDIS_URL` in `.env.local` and hosting dashboard.

### 5. Verification Checklist After Rotation
- [ ] Verify local tests pass: `npm test -- --run`
- [ ] Verify secret scanner passes: `npm run check:secrets`
- [ ] Verify database connectivity: `npm run db:check`
- [ ] Trigger deployment and verify production health endpoint: `GET /api/health/db`
