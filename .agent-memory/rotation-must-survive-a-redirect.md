# A rotated session has to be written even when the proxy redirects

`v-backend` **rotates** refresh tokens: a successful `POST /auth/refresh`
revokes the token that was sent and issues a new pair. So a refresh the portal
performs and then discards does not leave the session as it was — it leaves the
cookie holding a token the backend has already revoked.

The first version of `src/proxy.ts` refreshed near the top, then returned early
from two branches without writing the new cookie:

- a signed-in user opening a guest route (`/login`);
- any navigation by a user whose session carries `passwordChangeRequired`.

The second is the damaging one: that redirect fires on **every** navigation such
a user makes, so the first one burned the rotation and the next refresh failed
with a revoked token. A coordinator could be signed out in the middle of the
password change they were being forced to make.

Every response now goes through `carrySession()`, which writes the rotated
cookie — or clears it — whatever the response is. Two end-to-end tests assert
the cookie value changes across both redirects; they fail if the rotation is
dropped again.

The general rule: in the proxy, treat "refreshed" and "wrote the cookie" as one
step. An early `return NextResponse.redirect(...)` is where they come apart.
