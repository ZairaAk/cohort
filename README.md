# Cohort

Find study partners, form groups, study together in live rooms, and build up a reputation by actually helping people.

## Problem Statement

Students who want to study with others usually rely on random group chats. It is hard to find someone studying the same subject at a compatible level, with free time that matches yours, and there is no shared structure to keep a group consistent once it forms.

## Target Users

University and college students who want accountability partners, peer help, and a shared place to study.

## Solution

Cohort matches students by subject, skill level, and weekly availability, lets them form permissioned groups, and gives each group a live study room with a synced Pomodoro timer. Focus time feeds weekly group goals and personal streaks. A Q&A board rewards accepted answers, so reputation reflects helpfulness.

## Key Features

| Workflow | What the user can do |
|---|---|
| Profile and matching | Set subjects with skill levels and weekly availability, then get ranked partner matches with a score and the reason for it |
| Groups and membership | Create groups, request to join, owner approves or rejects, members can leave |
| Live study rooms | Join a room, see who is present, run a shared 25 minute focus / 5 minute break timer that stays in sync for everyone |
| Progress and streaks | Completed focus blocks count toward the group's weekly goal and each member's daily streak |
| Q&A and resources | Ask public or group-private questions, answer, accept the best answer, share links visible only to group members |

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, React Router, Vite |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Realtime | Socket.io |
| Auth | JWT, bcrypt password hashing |
| Validation | Zod |
| Security | Helmet, CORS allowlist, rate limiting on auth routes |
| Tests | Node built-in test runner |

## Architecture

```
client (React)  --HTTP /api-->  Express routes --> services --> Mongoose models --> MongoDB
      |                              |
      +----- Socket.io ------>  sockets/index.js --> RoomTimers (in-memory) --> progress service --> MongoDB
```

| Part | Responsibility |
|---|---|
| `server/src/routes` | HTTP endpoints. Thin: validate input, check permissions, call services |
| `server/src/services/matching.js` | Pure scoring and ranking logic, no DB access, unit tested |
| `server/src/services/roomTimer.js` | Server-owned Pomodoro state machine (idle, focus, break). Clients only render the end time |
| `server/src/services/streak.js` | Pure streak calculation by UTC day |
| `server/src/services/reputation.js` | Accepting an answer moves reputation points, never allows self-accepting |
| `server/src/middleware` | JWT auth, Zod validation, group membership and ownership checks, central error handler |
| `server/src/sockets` | Authenticated sockets, membership check on join, presence tracking, timer events |
| `client/src/pages` | One file per screen |

### Matching algorithm

Score out of 100 = 60% subject fit + 40% shared availability.

| Signal | How it is computed |
|---|---|
| Subject fit | Each shared subject scores 1, plus a bonus when levels complement (gap of 1 to 2 gets the largest bonus, equal levels a smaller one, gap of 3 or more none). Normalized against the smaller subject list |
| Shared availability | Each user's slots are merged first so overlapping slots are never double counted. Overlap minutes per week, capped at 10 hours for a full score |
| Filters | No shared subject, or under 30 minutes of overlap, means no match |
| Ties | Higher reputation ranks first |

### Permissions

| Action | Who |
|---|---|
| View group members, stats, resources, room, group questions | Group members only |
| Approve or reject join requests | Group owner |
| Delete a resource | Uploader or group owner |
| Accept an answer | The person who asked the question (not for their own answers) |
| Stop a running timer | Whoever started it, or the group owner |

### Design decisions

| Decision | Reason |
|---|---|
| Timer state lives on the server | Keeps every member in sync and prevents clients from faking focus time |
| Clients correct for clock skew using the server's timestamp | Countdowns match even if device clocks differ |
| Focus credit goes to members present at the end of the block | Simple and fair, and stopping early records nothing |
| Reputation only from accepted answers | Measures helpfulness, not popularity |

## Local Setup

Requires Node 20+ and a running MongoDB (local install or a free MongoDB Atlas cluster).

```bash
git clone https://github.com/ZairaAk/cohort.git
cd cohort
npm run install:all

cp server/.env.example server/.env
# edit server/.env and set a real JWT_SECRET and your MONGO_URI

npm run dev:server   # terminal 1, API on http://localhost:4000
npm run dev:client   # terminal 2, app on http://localhost:5173
```

Run the tests with `npm test`.

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `PORT` | server | API port, default 4000 |
| `MONGO_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Long random string used to sign tokens |
| `CLIENT_ORIGIN` | server | Allowed frontend origin for CORS and Socket.io |
| `VITE_API_URL` | client | Deployed API origin. Leave empty in local dev |

## API Overview

| Method and path | Purpose |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Accounts |
| `PUT /api/users/me` | Update subjects and availability |
| `GET /api/matches` | Ranked partner matches |
| `GET/POST /api/groups`, `GET /api/groups/:id` | Browse, create, view |
| `POST /api/groups/:id/join-requests`, `.../:userId/approve`, `.../:userId/reject` | Membership flow |
| `GET /api/groups/:id/stats` | Weekly progress and leaderboard |
| `GET/POST/DELETE /api/groups/:id/resources` | Shared links |
| `GET/POST /api/questions`, `GET /api/questions/:id`, `POST .../answers`, `POST .../accept/:answerId` | Q&A |
| Socket events | `room:join`, `room:leave`, `timer:start`, `timer:stop`, and server broadcast `room:state` |

## Deployment

| Piece | Suggested host | Notes |
|---|---|---|
| Database | MongoDB Atlas free tier | Allow access from the API host |
| API and sockets | Render or Railway web service | Root directory `server`, start command `npm start`, set the env vars above |
| Frontend | Vercel or Netlify | Root directory `client`, build `npm run build`, output `dist`, set `VITE_API_URL`. Add a rewrite of all paths to `/index.html` |

Live app: _add link_
Demo video: _add link_

## Known Limitations

| Limitation | Note |
|---|---|
| Room timers are held in server memory | A server restart ends running sessions. Fine for a single instance, a shared store would be needed to scale out |
| Streak days use UTC | Not adjusted to each user's timezone |
| No email verification or password reset | Out of scope for this version |
