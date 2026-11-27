# Release plan

The two acceptance scenarios are a public standalone site and a dispatch queue backed by an existing HAP app. In the second scenario, a signed-in employee finds a shipment on a phone and checks its pickup window and next action.

| Stage | Deliverable | Acceptance |
| --- | --- | --- |
| Packaging | Installable CLI and full skill folder | Fresh packages resolve their bundled files from a different directory |
| Planning | Versioned JSON, editable import and screen plan preview | A saved brief opens with the same choices. Version 0.2 briefs migrate |
| HAP integration | Owner-scoped picker and a documented server-side adapter contract | In a disposable organization, verify the picker and test the published app with two roles |
| Frontend | Standalone and dispatch templates with shared styles | Verify the primary task on mobile and keyboard. Exercise loading, empty and error states |
| Design review | A common design rubric and performance checks | Record observations and before/after traces. Compare the same brief with and without the kit |
| Release | Tested archive, SHA256, README and media | Install the archive in a clean project and run both scenarios. Record the outcome of the hosted test |

## Reference projects

| Reference | Application |
| --- | --- |
| [Impeccable](https://github.com/pbakaus/impeccable) | Review hierarchy, spacing, states and visual consistency on the rendered screen |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Choose and record a visual direction for the page's content and task |
| [Emil Kowalski](https://github.com/emilkowalski/skills) | Review the timing, focus behavior and reduced-motion treatment of interactions |
| [Cloudflare web-perf](https://github.com/cloudflare/skills/tree/main/skills/web-perf) | Compare browser traces for the same route, device and task |
| [HAP Compute](https://help.mingdao.com/en/compute/) | Initialize the project, configure access, run the platform review, deploy and verify the live URL |

Use the application and access contract first, then the approved journey and visual choices, then the relevant design guidance. The kit implements its own instructions and examples. Record provenance, revision and license before importing upstream files.

## GitHub and acceptance

GitHub Actions checks the installed CLI on Node 18 and current LTS. Package the complete skill folder at release and include installation instructions, release notes and SHA256. For layout changes, capture the same content before and after at the same viewport. Log observations without including application records or credentials.

For a live test, use an organization and Compute environment approved for disposable apps. Confirm the actual organization, apps returned by the PAT, access settings and worksheet mapping. Test an allowed and a restricted user, the public path if required, and the same workflow after signing in again. Keep the local synthetic test separate from the live acceptance result.

## Media

The README screenshot and GIF use the local planner and a synthetic order. To regenerate them, make Google Chrome, Playwright and Sharp 0.35.5 available, then run `node scripts/capture.cjs` from the repository root. Capture the full brief-to-site workflow after live acceptance.

## Research comparison

Run the same brief and acceptance task with the same agent and model in both conditions. Measure time to the first usable result, task failures, accessibility findings and interaction latency. Collect visual preferences blind to the condition and report all observed outcomes.
