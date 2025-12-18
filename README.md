# Mini Event Platform — MERN Stack

This repository is a compact MERN (MongoDB, Express, React, Node) implementation of a mini event platform built as an intern assignment.

## What this update does
- Provides clear, copy/paste run instructions for Windows PowerShell.
- Documents the RSVP capacity & concurrency strategy and shows the specific atomic update used.
- Lists all implemented features.

## Quick Local Setup (Windows PowerShell)

Prerequisites:
- Node.js (14+), npm
- MongoDB (Atlas or local)

1) Backend

- Create `server/.env` and set:
  - `MONGO_URI` — MongoDB connection string (Atlas or localhost)
  - `JWT_SECRET` — a random secret for signing JWTs
  - `PORT` — optional (defaults to 5000)

Run these commands in PowerShell:

```(in server folder)
npm install
npm run dev
```

The API base will be `http://localhost:5000/api` by default; uploaded images are available under `http://localhost:5000/uploads/<filename>`.

2) Client

```(in client folder)
npm install
npm start
```

If the client uses `REACT_APP_API_URL`, ensure it points to `http://localhost:5000/api` (or your backend URL).

3) Optional: Run concurrency test (server)

From the `server` folder the repository includes a concurrency test script that creates many users and issues concurrent RSVP join requests to validate there is no overbooking:

```powershell
cd c:\Users\smaroju\Desktop\New_Project\server
npm run concurrency-test
```

## Technical Explanation — RSVP capacity & concurrency handling

Goal: Prevent event overbooking and duplicate RSVPs even when many clients send requests concurrently.

Strategy used in this project:
- Keep RSVP state inside the single `Event` document: an `attendees` array and an `attendeesCount` number.
- Use a single atomic update (`findOneAndUpdate`) with a filter that requires the user is not already in `attendees` and that `attendeesCount < capacity`.
- The update uses `$addToSet` to add the user to `attendees` and `$inc` to bump `attendeesCount`. Because MongoDB guarantees single-document atomicity, multiple concurrent requests cannot increment past capacity.

Representative code (from `server/routes/events.js` — simplified):

```js
// join endpoint (simplified):
const userId = req.user._id; // ObjectId
const userIdStr = String(userId);

const filter = {
  _id: eventId,
  attendees: { $nin: [userId, userIdStr] },
  $expr: { $lt: ["$attendeesCount", "$capacity"] }
};

const update = {
  $inc: { attendeesCount: 1 },
  $addToSet: { attendees: userId }
};

const updated = await Event.findOneAndUpdate(filter, update, { new: true });
if (!updated) {
  // either user already joined or event is full — fetch event to determine the reason
}
```

Why this is correct:
- The `findOneAndUpdate` runs atomically on the server. The filter check and the update happen as one operation; only requests that satisfy the filter will perform the update.
- When many clients race to join, only the first N (remaining capacity) will match the filter and succeed; subsequent requests will return `null` and are handled as "Event full" or "Already joined".

Notes & hardening included in this implementation:
- The filter checks both ObjectId and string forms of the user id (`$nin: [userId, userIdStr]`) to handle historic documents that may contain string ids.
- `leave` uses a symmetric atomic update with `$pull` and `$inc: { attendeesCount: -1 }`.
- This design avoids multi-document transactions by keeping RSVP state in one document. If you split attendees into another collection, use transactions or a different locking strategy.

## Files / places to inspect (where logic lives)
- `server/models/Event.js` — Event schema (`attendees`, `attendeesCount`, `capacity`).
- `server/routes/events.js` — create, list, edit, delete, join, leave endpoints (join/leave use the atomic updates described).
- `server/scripts/concurrency-test.js` — script to simulate many parallel join requests for testing.

## Implemented Features

- Authentication
  - Signup and login with bcrypt password hashing and JWT tokens.
  - Protected API routes that verify the JWT and attach `req.user`.

- Event management
  - Create events (with optional image upload using `multer`).
  - Read/list events (including upcoming events, user’s events, and single event details).
  - Update and delete events (creator-only permissions enforced).

- RSVP system
  - `POST /api/events/:id/join` — atomic join (prevents duplicates and overbooking under concurrency).
  - `POST /api/events/:id/leave` — atomic leave.
  - Client-side and server-side checks to avoid duplicates.

- Frontend (React)
  - Login/Signup pages, protected routes, and token handling via localStorage.
  - Dashboard listing events in a responsive table with search and date filters.
  - Create/Edit event forms using `FormData` for image upload and client validation.
  - `My Events` page showing events the user created and events the user is attending.
  - Disabled Join/Leave buttons with explanatory tooltips.
  - Dark mode toggle and improved navbar.

- Developer utilities
  - `server/scripts/concurrency-test.js` to validate RSVP atomicity.
  - Server ensures `server/uploads/` exists on startup.

## Troubleshooting & Notes

- If uploads fail, confirm `server/uploads` exists; server creates it automatically when starting.
- If you see quick `confirm`-related ESLint warnings, they were replaced with `window.confirm(...)`.
- If `npm install` fails with registry errors, run:

```powershell
npm config set registry https://registry.npmjs.org/
npm install
```

## Next steps (optional enhancements)

- Migrate older event documents to normalize attendee ids to ObjectId (small migration script).
- Use S3 (or another object store) for images and serve via CDN.
- Add server-side pagination and search endpoints for large datasets.
- Add rate-limiting, logging, and monitoring for production readiness.

---

If you want, I can add a brief migration script to convert string attendee ids to ObjectId, or add deployment instructions for Render/Vercel. Tell me which and I'll add it.
