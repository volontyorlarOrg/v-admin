# An uncoded 404 means the route does not exist

The portal has to tell two failures apart:

1. the backend has not shipped this endpoint yet — show "waiting for the API";
2. the record is gone, or this account may not see it — show "not found".

Both arrive as `404`. The signal is the body: `v-backend` attaches a `code` to
every deliberate error (`userNotFound`, `opportunityNotFound`, `forbidden`), and
Nest's own "no such route" reply carries none.

So `loadedFromError` reads a `404` or `501` as `awaitingContract` **only** when
the endpoint is not `published` **and** the body has no code. Everything else is
a real, explainable failure.

Getting this wrong is not cosmetic: an unauthorised record would have read as
"the API is unfinished", which is both wrong and reassuring in the wrong
direction. An end-to-end test covers it — a coordinator opening a volunteer who
never applied to their vacancies must see "Not found", never "Waiting for the
API".
