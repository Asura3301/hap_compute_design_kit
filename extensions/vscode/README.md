# HAP Compute Design Kit for VS Code

Use **HAP Design: Open Planner**, **HAP Design: Preview Styles**, **HAP Design: Validate Brief** and **HAP Design: Scaffold Frontend** in the Command Palette. These commands run the same Design Kit CLI as the Codex skill.

Install Node.js 18 or later on the local machine and restart VS Code. Download the VSIX from the Design Kit workflow artifacts and choose **Extensions → Install from VSIX**. Use a trusted workspace. The extension uses the installed Node executable and sends no telemetry.

For development, open a terminal in the repository and run `code --extensionDevelopmentPath="$PWD/extensions/vscode"`. The packaged extension brings its own copy of the kit.
