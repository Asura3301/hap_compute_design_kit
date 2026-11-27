# AeroFreight Operations Desk

This example runs a Compute website against an existing air-freight HAP application. The browser calls a same-origin API. The API validates the Compute session, gets a HAP provider access token for that session and calls the HAP V3 rows API as the visitor. HAP applies the visitor's record and field permissions. Finance, contacts and attachments are outside the field projection.

## Run with sample data

From the repository root, run `npm run demo` and open the printed loopback URL. Run `npm run demo -- --limited` to see a restricted account that can view one shipment and has no access to operation history. The local fixture is a development server and belongs outside the Compute deployment.

## Deploy a connected preview

1. Use the official Compute skill to initialize a Node.js blank project with Mingdao login in the intended organization. Preserve its `auth/index.mjs` and `auth/jwt.cjs`.
2. Copy `adapter.mjs`, `server.mjs` and the four files under `public/` into the generated project. Keep the managed authentication files and access policy. Keep the target binding and settings out of Git.
3. Set `hapAppId` in the generated manifest to the existing HAP app ID. Compute injects the API base URL. Put the nonsecret worksheet mapping in the root function's versioned release settings under `DESK_WORKSHEETS` as a JSON string with `appId`, `orders` and `operations`. Use the real app and worksheet IDs only in the private deployment settings. No app-level key, sign or PAT is needed in the project.
4. The orders worksheet must provide the aliases in `orderFields` in the adapter, including the origin and destination relations and the order status. The operations worksheet must have `biz_order` linking to the parent and the aliases in `eventFields`. Adjust those mappings for another schema.
5. Review the exact archive and publish its preview through the official Compute workflow. Check the preview URL with a fresh browser session and confirm the anonymous API returns 401. Sign in as an operator, compare the detail and timeline with HAP, and repeat using a second account with limited worksheet access.

The queue paginates by 40 visible orders. Search, status filters and the in-motion and exception metrics apply to the current page. The total uses the count from HAP. The timeline shows at most 30 visible operations per order. Missing values show as a dash. A user who cannot open an order receives a 404, even if the URL came from another user.

[HAP Compute guide](https://help.mingdao.com/en/compute/) · [HAP API V3](https://help.nocoly.com/api/v3/)
