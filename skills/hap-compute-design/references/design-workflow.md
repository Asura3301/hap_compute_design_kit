# From the brief to a working site

Use the [Impeccable workflow](https://impeccable.style/docs/) to shape and review the surface. `hap-design handoff` writes a PRODUCT.md with durable product context, a DESIGN.md with the selected preview tokens, and a FUNCTIONALITY.md with the proposed scope. Keep these in the website project. The design document starts with the brief's preset and needs refinement against an approved site-specific direction.

## Define what must work

For a redesign, run the current site before editing. Capture the critical actions by role and verify existing routes, form rules, workflow triggers, data changes, attachments and failures. Use only the features that apply to this project. For a new interface over HAP, map the chosen actions to the existing HAP views, records or business operations. Verify scope before specifying a write to test.

| Action | Current behavior | HAP data or operation | Role | Result and failure | Browser test |
| --- | --- | --- | --- | --- | --- |
| Submit a service request | Required fields checked before submission | Existing request worksheet and configured workflow | Requester | Record saved and reference shown. Validation leaves data intact | Submit in a test environment, read the saved record and verify the expected workflow |

Use the real schema and policy for the agreed test environment. Include a test for denied access by a restricted role. Use the actual sign-in as an acceptance step when deploying.

## Choose and apply a direction

- **Impeccable** supplies the surface modes. Operate prioritizes repeated tasks and comparison. Persuade prioritizes the offer and next action. Read prioritizes finding and consuming information. If installed, ask the agent to run `$impeccable shape` on the proposed screen, then `$impeccable critique` and `$impeccable audit` on the rendered result. [Impeccable commands](https://impeccable.style/docs/)
- **Taste Skill** informs the visual direction for public pages. Identify relevant patterns from two references, agree which patterns fit this site's content, and use the real product UI or appropriate imagery. Check alignment and typography at desktop and phone widths. [Taste Skill](https://github.com/Leonxlnx/taste-skill)
- **Emil Kowalski's skills** apply to implemented interactions. Exercise focus after closing overlays, feedback from buttons and form submissions, and the reduced-motion setting. Prefer immediate updates for frequent actions. [Skills for Designers and Engineers](https://github.com/emilkowalski/skills)

The accepted brief and existing behavior determine what applies. Load upstream skills explicitly when available. Record which skill, command or local check was actually used. Review the rendered page using [the frontend checks](review.md) and fix issues before requesting a live preview.
