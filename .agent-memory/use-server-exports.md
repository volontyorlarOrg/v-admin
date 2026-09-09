# A "use server" file may export only async functions

`src/lib/<domain>/actions.ts` carries `"use server"`, which makes every export a
callable server endpoint. Exporting a Zod schema, a constant or a type from one
of those files fails the build with a message that does not name the export.

So every schema an action validates with lives beside it and is imported in:

| Action file                | Schema file               |
| -------------------------- | ------------------------- |
| `attendance/actions.ts`    | `attendance/schema.ts`    |
| `applications/actions.ts`  | `applications/review.ts`  |
| `vacancies/actions.ts`     | `vacancies/form.ts`       |
| `coordinators/actions.ts`  | `coordinators/schema.ts`  |
| `organizations/actions.ts` | `organizations/schema.ts` |

The schema files are also what the unit tests import, which is the second
reason: a test that imported the action file would pull `server-only` in with it.
