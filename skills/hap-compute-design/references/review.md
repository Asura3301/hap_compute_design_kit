# Frontend review

Review the rendered page with the approved brief and real-length sample content. Start with the primary task and the smallest supported viewport.

| Check | Evidence |
| --- | --- |
| Purpose and hierarchy | A visitor can identify the first useful action. For a workspace, test a repeated task. For a public page, confirm the main offer and action |
| Typography and density | Compare text wrapping, scanning and status legibility using the chosen preset and brand |
| Interaction | Check keyboard focus, pointer and touch targets, pending, empty and error states, retry behavior and reduced-motion settings |
| Integration | Verify the same user journey with the real access policy and adapter mapping |
| Performance | Record the same route and task before and after under equivalent conditions |

Use [Cloudflare web-perf](https://github.com/cloudflare/skills/tree/main/skills/web-perf) when available. Collect a lab trace for page load, layout shifts and the primary interaction. Report the viewport, device settings, route and method. Label synthetic measurements as lab results. Field Core Web Vitals require actual visits.

For a review report, name the screen, expected behavior, observation and reproduction steps for each finding. The [reference guide in the repository](https://github.com/Asura3301/hap_compute_design_kit/blob/main/docs/ROADMAP.md) describes the upstream inspirations.
