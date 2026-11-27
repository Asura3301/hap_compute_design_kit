# Design references

The kit implements its own code, planner and review instructions. The optional upstream skills run in the user's coding host. They are useful for a focused review after the Design Kit has established the project brief and HAP integration contract.

| Reference | Use in a HAP project |
| --- | --- |
| [Impeccable](https://github.com/pbakaus/impeccable) | Run one critique of the built screen. Check hierarchy, spacing and component consistency. Use the upstream installer documented in the project |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Compare typography and composition during discovery. Record the user's decision in the brief before writing components |
| [Emil Kowalski's skills](https://github.com/emilkowalski/skills) | Review interaction timing, keyboard focus and reduced motion after components are working |
| [Cloudflare web-perf](https://github.com/cloudflare/skills/tree/main/skills/web-perf) | Compare traces for the same primary task at the same viewport |

The app's current access policy, the confirmed primary task and its design brief determine which upstream suggestions to apply. Load one specialized skill for the review in progress.

Impeccable declares Apache-2.0. Taste Skill and Emil Kowalski's repository declare MIT. Preserve the required license and notices if you choose to import upstream source. This repository installs without upstream runtime dependencies.
