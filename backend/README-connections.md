## Connections Service

Friend connections are managed through a dedicated `connections` module that supports sending, accepting, declining, and removing friend relationships between authenticated users.

### API Routes

- `GET /connections` — Returns the authenticated user's friend graph including `friends`, `incomingRequests`, `outgoingRequests`, and summary `counts`.
- `POST /connections/requests` — Creates a pending friend request. Request body: `{ "recipientId": "<uuid>", "message"?: string }`.
- `POST /connections/requests/:requestId/accept` — Accepts a pending friend request (recipient only).
- `POST /connections/requests/:requestId/decline` — Declines a pending friend request (recipient only).
- `DELETE /connections/friends/:friendId` — Removes an accepted friendship in both directions.
- `GET /inbox` — Returns the authenticated user's inbox snapshot (incoming/outgoing requests, counts, fetched timestamp).

All endpoints require a valid bearer token and rely on `auth/middleware/authMiddleware`.

### Persistence

- When Supabase credentials are configured, persistence is backed by the following tables:
  - `friend_requests` — Tracks request lifecycle (`pending`, `accepted`, `declined`, `cancelled`) with optional messages.
  - `friendships` — Stores undirected relationships with a composite primary key (`user_id`, `friend_id`).
- In local/stub mode (no Supabase), the store falls back to an in-memory map for fast iteration and testing.

See `db/migrations/20251109_friend_connections.sql` for full schema definitions. Run the migration in your Supabase project to enable persistent connections.

### Response Shapes

The service surfaces reusable friend graph and inbox types (`FriendGraph`, `FriendInbox`, `FriendEdge`, `FriendRequestSummary`) in `frontend/src/types/user.ts`. Each friend/request includes a lightweight `profile` snapshot derived from Supabase metadata when available.


