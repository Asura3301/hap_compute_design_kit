# HAP Compute handoff

Use the official [Compute setup and deployment guide](https://help.mingdao.com/en/compute/) and the installed Compute skill for the target environment. Decide with the user whether the app should be public, restricted or split into public and private surfaces. Verify that the environment supports the desired access policy before designing a mixed site.

## Apply a starter

1. Validate the brief with `hap-design check` and confirm the screen plan.
2. Use `hap-design scaffold design-brief.json --template dispatch --out ./design-preview` for a queue or choose `standalone` for a public example. Open `design-preview/public/index.html` for a local preview. The starter uses sample content. Adapt it to the approved audience, navigation, data and brand.
3. For a new Compute site, initialize it through the official skill. For an existing site, work from its authorized source and verify the target binding. Compare the generated frontend with the existing `public/` directory. Merge only the required assets and interactions, preserving the target app's entry points, API behavior and login flow.
4. Test each agreed workflow before handing the reviewed build back to the Compute skill. Record its actual preview or deployment URL and test the published route. Use the official login-page workflow for changes to the hosted sign-in screen.

## Connect the dispatch template

For a local adapter demo, set the `dispatch-endpoint` meta value in the generated `index.html` to a same-origin `/api/` route implemented by your existing server adapter. An empty value displays the sample queue. Keep the sample dataset out of the connected app's deployment once the real binding is in place.

In a managed Compute deployment, preserve the target template's access bootstrap and authenticated API client. Verify sign-in and access before presenting business data. Use the sample to understand UI states and adapt its interactions to the target's authorized API contract.

The sample frontend expects HTTP 200 and a JSON array of authorized orders. Return a bounded result set of records with four string fields. Use an empty array for no orders and HTTP 401 or 403 for unauthorized sessions. Return a non-success status for temporary backend failures.

```json
[
  {
    "id": "1048",
    "status": "Awaiting pickup",
    "window": "14:00–16:00",
    "nextAction": "Confirm the carrier's arrival time."
  }
]
```

Map the fields against the selected worksheet after inspecting its schema. Enforce access in the adapter, using the signed-in HAP user's authorization where the workflow requires per-user access. When the adapter uses an app-level credential, enforce the intended record visibility independently. Set secrets in the target environment and keep them out of the public directory, exported brief and version control. The planner PAT is only for local app discovery.

For live acceptance, use a disposable test app and synthetic HAP records. Check that the intended employee can find the order on a phone, another test user receives the correct restricted view, a fresh session follows the intended sign-in route, and the live URL serves the reviewed version.
