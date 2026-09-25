# Volontyorlar Administrator Portal Documentation

Use this file to route a question to the smallest source that answers it.

| Task                                                                                              | Read                                                                                   |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| What the product is, and what an administrator does                                               | [`../PRODUCT.md`](../PRODUCT.md)                                                       |
| The design system as applied to an operational portal                                             | [`../DESIGN.md`](../DESIGN.md)                                                         |
| Routes, rendering, module ownership, the two-portal split                                         | [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md)                         |
| Today: what waits on an administrator, in what order, and how a decision leaves it                | [`architecture/TODAY.md`](architecture/TODAY.md)                                       |
| Insights statistics, sources, completeness limits and chart rules                                 | [`architecture/INSIGHTS.md`](architecture/INSIGHTS.md)                                 |
| The country ground: geometry, placement, motion                                                   | [`architecture/GROUND.md`](architecture/GROUND.md)                                     |
| **The backend contract** — generated types, the endpoint registry, what "awaiting contract" means | [`api/BACKEND_CONTRACT.md`](api/BACKEND_CONTRACT.md)                                   |
| Sessions, cookies, headers, secrets, password handling                                            | [`security/SECURITY.md`](security/SECURITY.md)                                         |
| Setup, commands, environment, ports, CI, deployment                                               | [`operations/DEVELOPMENT_AND_DEPLOYMENT.md`](operations/DEVELOPMENT_AND_DEPLOYMENT.md) |
| Adding a section, an endpoint, copy, a form, a state                                              | [`operations/EXTENDING.md`](operations/EXTENDING.md)                                   |
| Why there is no administrator creation and no impersonation                                       | [`../PRODUCT.md`](../PRODUCT.md#two-things-this-portal-will-not-do)                    |
| A non-obvious decision, discovery or gotcha                                                       | [`../.agent-memory/README.md`](../.agent-memory/README.md)                             |

## Source-of-truth order

When sources disagree, investigate in this order:

1. executable code;
2. current configuration;
3. `AGENTS.md`;
4. current `/docs`;
5. persistent memory.

## Documentation boundary

These pages separate three kinds of truth:

- **Implemented** — verified in current source or configuration.
- **Presented** — product direction, not proof of an implementation.
- **Needs verification** — no evidence is available in the workspace.

Unknowns stay explicit. They are not filled with an assumed contract, hostname
or claim. The endpoint registry is the same discipline applied to the API: an
operation this portal calls is marked `published`, `announced` or `requested`,
and a test keeps those labels honest.
