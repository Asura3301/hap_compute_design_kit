# Changelog

## 0.5.0

- Require explicit decisions about site purpose, source, access and visual direction.
- Ask for sign-in, permissions, public scope and existing workflows where applicable.
- Preview the same visual choices on a workspace, public page or information portal at two widths.
- Generate product, design and functional context with the `handoff` command.
- Specify pre-build review and end-to-end workflow verification for the agent.

## 0.4.0

- Add a Codex plugin manifest, local marketplace and a VS Code extension with a packaged CLI.
- Publish plugin, skill, CLI and VSIX artifacts through GitHub Actions.

## 0.3.1

- Use the documented HAP owner query and verify the returned ownership flag. Support HTTPS bases for HAP SaaS and HAP Server.
- Share palette, typeface and density values between the planner preview and generated starters.
- Check that the local starter pages stay below 16 KiB without third-party requests.

## 0.3.0

- Translate the planner, CLI messages, README and release documentation into English.
- Export versioned briefs, reopen them for editing and import briefs from 0.2.
- Add screen plan preview and the `check` and `scaffold` commands.
- Add standalone and dispatch starters and document the Compute adapter contract.
- Test packaged installation, CLI behavior and browser journeys in GitHub Actions. Build npm and skill archives with SHA256 checksums.

## 0.2.0

- Add the local planner, visual presets, PAT app discovery and an initial dispatch example.
