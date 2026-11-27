---
name: hap-compute-design
description: Design or refine the frontend of a HAP Compute site, workspace or portal. Use for visual direction, reusable UI patterns, accessible interactions and local browser review.
---
Read the target app and its user brief. Identify the role, primary task, device, existing visual system and data states. For a real Compute app consult the installed hap-compute-app skill and its application reference. For a standalone design exercise use synthetic records.

Choose one visual direction per surface. On a marketing site lead with the actual offer and relevant imagery. In a repeated workflow prioritize the next action, comparison and information density. Preserve existing tokens during a refinement. Use the example in assets/templates/index.html and shared styles in assets/components/ui.css as optional starting points. Copy needed assets into the target's public directory and adjust relative links. Preserve working event handlers, API contracts, authentication and forms.

Use semantic controls, visible keyboard focus and textual statuses. Give each action pending, success and recoverable failure behavior where applicable. Keep repeated interactions immediate and honor reduced motion. Verify a representative task with keyboard and touch-width layout, including long labels, empty results and errors. Inspect the rendered page before claiming visual validation. When speed is a concern use Cloudflare web-perf if available and compare traces before and after.

See references/compute.md for the integration boundary. A design review produces local frontend changes and observed findings. For requested publication use the installed Compute workflow.
