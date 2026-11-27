---
name: hap-compute-design
description: Run the discovery, design and workflow verification of standalone or HAP-connected Compute frontends. Use for new sites, redesigns and visual review that must preserve existing application behavior.
---

## Discovery before implementation

For a new surface or a redesign, inspect the existing site and the available organization/app context read-only. Then collect missing decisions in the bundled planner or ask in chat. Ask in rounds of up to three plain-language questions with choices. Show actual app names when the authorized API or MCP can list them. Wait for the user's answers before assuming the app, login, scope or visual direction.

1. Choose the source (standalone or a named HAP app), audience and primary job. For an existing frontend, ask whether to preserve every current website workflow or cover a specified subset. Ask which actions must work, including changes and approvals when relevant.
2. Choose public, organization-only, invited or mixed access. Ask how users sign in, which pages are public, and what each role can view and do. Verify provider and routing support with the installed Compute skill.
3. Choose the first page purpose, important devices, languages and accessibility needs. Show two distinct screen directions for the same task and content, with typography, density and mobile behavior visible. Ask the user to choose or refine one, then confirm the acceptance task.

Use `hap-design new` to open the planner, or include `--org ID --origin HTTPS_API_BASE` for the local PAT-based owner picker. Existing version 1 briefs can be reopened to complete discovery. A narrow fix to an existing surface uses confirmed decisions from the current brief.

## Build and verify

1. Read [the design workflow](references/design-workflow.md). Validate the selected brief with `hap-design check` and generate context with `hap-design handoff`. Merge confirmed information into existing project documents by agreement.
2. Map every in-scope action to current behavior, its HAP fields or operation, allowed roles, side effects, and a browser test. Keep current URLs, permissions, forms and integration contracts for workflows in scope. Confirm the proposed coverage and visual direction before coding.
3. Implement the approved screen with the existing frontend stack and verified data bindings. For connected sites consult [the Compute handoff](references/compute.md) and the installed Compute skill for app access, authentication and publication.
4. Complete the workflow tests and visual review on representative data in a browser. Verify loading, empty, failure and denied states where applicable. Report the checks actually run, unresolved bindings and any missing role or deployment evidence. A scaffold or preview with synthetic data only proves the UI interactions exercised there.
