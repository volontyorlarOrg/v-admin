# Agent memory

Durable, non-obvious decisions and gotchas for this repository. One file per
fact. Not a changelog, and not a place for anything the code already says.

| Note                                                                         | Why it exists                                            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`use-server-exports.md`](use-server-exports.md)                             | Why every Zod schema sits beside its action, not in it   |
| [`uncoded-404-means-no-route.md`](uncoded-404-means-no-route.md)             | How "waiting for the API" is told apart from "not found" |
| [`resolved-attendance-stays.md`](resolved-attendance-stays.md)               | Why the attendance list keeps decided rows               |
| [`rotation-must-survive-a-redirect.md`](rotation-must-survive-a-redirect.md) | Why the proxy writes the session cookie on redirects too |
