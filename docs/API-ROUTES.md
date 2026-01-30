# API Routes Reference

For every route: **route** (method + path) and **the rest** (auth, body/query, response).

---

## Agency

### Get agency roster (My Models)

- **Route:** `GET /api/agency/models`
- **Auth:** Required, cookie; role must be `agency`.
- **Query:** None.
- **Response:** `200` → `{ roster: AgencyRosterItem[] }`
  - `AgencyRosterItem`: `id`, `username`, `email`, `displayName`, `avatarUrl`, `location`, `bio`, `verificationStatus`, `availability`, `luxlaneScore`, `submissions[]`
  - Each `submission`: `id`, `status`, `submittedAt`, `casting` (id, title, type, status, location, startDate, endDate, deadline).
- **File:** `app/api/agency/models/route.ts`
- **Client:** `api.getAgencyRoster()` in `lib/api-client.ts`

---

## Auth

| Route | Method | Auth | Body / Query | Response |
|-------|--------|------|-------------|----------|
| `/api/auth/login` | POST | — | `{ email, password }` | `{ user, accessToken }` + Set-Cookie refresh |
| `/api/auth/signup` | POST | — | `{ email, password, displayName, role, username? }` | `{ user }` |
| `/api/auth/me` | GET | Cookie | — | `{ user }` |
| `/api/auth/refresh` | POST | Cookie (refresh) | — | `{ accessToken }` |
| `/api/auth/logout` | POST | Cookie | — | 200 |

---

## Castings

| Route | Method | Auth | Body / Query | Response |
|-------|--------|------|-------------|----------|
| `/api/castings` | GET | — | `status`, `query`, `tags`, `creatorId`, `limit`, `offset` | `{ castings }` |
| `/api/castings` | POST | Brand/Agency | Casting fields | `{ casting }` |
| `/api/castings/[id]` | GET | — | — | Casting + requirements |
| `/api/castings/[id]/apply` | POST | Model | `{ note? }` | `{ submission }` |
| `/api/castings/[id]/submit` | POST | Agency | `{ modelIds[], note? }` | `{ success, submissionsCreated }` |
| `/api/castings/[id]/saved` | GET/POST/DELETE | User | — | Saved state / 200 |
| `/api/castings/[id]/submission` | GET | User | — | User's submission if any |
| `/api/castings/[id]/submissions` | GET | Creator | — | All submissions for casting |

---

## Profiles

| Route | Method | Auth | Body / Query | Response |
|-------|--------|------|-------------|----------|
| `/api/profiles/me` | GET/PATCH | User | PATCH: profile/model fields | Profile + role profile |
| `/api/profiles/[username]` | GET | — | — | Public profile by username |
| `/api/profiles/model` | PATCH | Model | ModelProfile fields | Updated model profile |

---

## Conversations & Messages

| Route | Method | Auth | Body / Query | Response |
|-------|--------|------|-------------|----------|
| `/api/conversations` | GET | User | — | `{ conversations }` with last message + other user |
| `/api/conversations/direct/[userId]` | GET/POST | User | — | Get or create direct conversation |
| `/api/conversations/[id]/messages` | GET/POST | Member | GET: `before?`, `limit` | `{ messages }` / created message |

---

## Posts (Feed)

| Route | Method | Auth | Body / Query | Response |
|-------|--------|------|-------------|----------|
| `/api/posts` | GET | — | `limit`, `cursor` | `{ posts }` |
| `/api/posts` | POST | User | `{ imageUrl, caption? }` | Created post |
| `/api/posts/[id]/like` | POST/DELETE | User | — | Toggle like, `{ liked, count }` |
| `/api/posts/[id]/save` | POST/DELETE | User | — | Toggle save |
| `/api/posts/[id]/comments` | GET/POST | — / User | POST: `{ body }` | `{ comments }` / created comment |

---

## Other

| Route | Method | Auth | Body / Query | Response |
|-------|--------|------|-------------|----------|
| `/api/settings` | GET/PATCH | User | PATCH: settings fields | User settings |
| `/api/follows/[userId]` | POST/DELETE | User | — | Follow / unfollow |
| `/api/notifications` | GET | User | — | Notifications list |
| `/api/notifications/[id]/read` | PATCH | User | — | Mark read |
| `/api/media/presign` | POST | User | Upload metadata | Presigned URL |
| `/api/media/confirm` | POST | User | Final asset payload | Confirm upload |
| `/api/models/top` | GET | — | — | Top models |
| `/api/scoreboard` | GET | — | — | Scoreboard data |

---

When adding or changing a route, update this file with: **route**, **method**, **auth**, **body/query**, and **response** (and file/client if relevant).
