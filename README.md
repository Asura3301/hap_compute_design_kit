# hap_compute_design_kit
Additional Skill To Design Websites with HAP Compute

## Install the design skill
From a checked-out copy, copy the entire skills/hap-compute-design directory into the agent's project skills directory (for example .agents/skills/). The component stylesheet, example template and integration guide travel with it. The HTML example opens directly from assets/templates/index.html. Installation does not modify application files. Copy a recipe into the target application when needed.

Install the HAP Compute platform skill separately through its supported distribution. The design kit can also work locally with synthetic data.

## Design references
Original instructions and assets informed by [Impeccable](https://github.com/pbakaus/impeccable), [Emil Kowalski's skills](https://github.com/emilkowalski/skills) and [Taste Skill](https://github.com/Leonxlnx/taste-skill). Optional performance audits use [Cloudflare web-perf](https://github.com/cloudflare/skills/tree/main/skills/web-perf).

## Project planner
With Node 18+ run `npm link` inside `skills/hap-compute-design` to expose the local `hap-design` command, or call `node skills/hap-compute-design/bin/hap-design.mjs` directly. No runtime dependencies.

- `hap-design new` prints a private local HTML file URL. Open it, configure the site, compare live visual options and download design-brief.json for the coding agent.
- `hap-design styles` opens the same workflow at its appearance section via the printed URL.
- `hap-design apps --org ORG_ID --origin https://YOUR-TRUSTED-API-HOST` lists currently owned apps. Supply HAP_PAT through the local environment. Use the exact API origin of the organization. The CLI sends the token only to that origin. Use the same options with `new` to populate the picker. The temporary HTML contains app names and IDs. Keep it local.
