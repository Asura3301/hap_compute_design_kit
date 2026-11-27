const {execFile} = require('node:child_process');
const {existsSync} = require('node:fs');
const {dirname, join} = require('node:path');
const {promisify} = require('node:util');
const vscode = require('vscode');

const execute = promisify(execFile);

function activate(context) {
  const bundled = join(context.extensionPath, 'kit/bin/hap-design.mjs');
  const cli = existsSync(bundled) ? bundled :
    join(context.extensionPath, '../../skills/hap-compute-design/bin/hap-design.mjs');

  function command(id, action) {
    context.subscriptions.push(vscode.commands.registerCommand('hapDesign.' + id, async () => {
      try {
        if (!vscode.workspace.isTrusted) throw Error('Open a trusted workspace to use the Design Kit.');
        await action();
      } catch (error) {
        const message = error.code === 'ENOENT' ? 'Install Node.js 18+ and restart VS Code.' :
          error.stderr?.trim() || error.message;
        vscode.window.showErrorMessage('HAP Design: ' + message);
      }
    }));
  }

  async function run(args, cwd = context.extensionPath) {
    return (await execute('node', [cli, ...args], {cwd, timeout: 30000, windowsHide: true})).stdout.trim();
  }

  async function chooseBrief() {
    const result = await vscode.window.showOpenDialog({canSelectMany: false, filters: {'Design brief': ['json']}});
    return result?.[0]?.fsPath;
  }

  async function openPlanner(kind) {
    const uri = vscode.Uri.parse(await run([kind]));
    if (uri.scheme !== 'file') throw Error('The planner did not produce a local file.');
    if (!await vscode.env.openExternal(uri)) {
      await vscode.window.showTextDocument(uri);
      vscode.window.showInformationMessage('Open the planner HTML file in your browser to use it.');
    }
  }

  command('new', () => openPlanner('new'));
  command('styles', () => openPlanner('styles'));
  command('check', async () => {
    const file = await chooseBrief();
    if (!file) return;
    await run(['check', file], dirname(file));
    vscode.window.showInformationMessage('Design brief is valid.');
  });
  command('scaffold', async () => {
    const file = await chooseBrief();
    if (!file) return;
    const template = await vscode.window.showQuickPick(['standalone', 'dispatch'], {placeHolder: 'Choose a website starter'});
    if (!template) return;
    const parent = await vscode.window.showOpenDialog({canSelectFiles: false, canSelectFolders: true, canSelectMany: false});
    if (!parent?.[0]) return;
    const name = await vscode.window.showInputBox({prompt: 'Name a new output directory',
      validateInput: value => /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value) ? undefined : 'Use letters, numbers, dashes or underscores.'});
    if (!name) return;
    const index = await run(['scaffold', file, '--template', template, '--out', join(parent[0].fsPath, name)], dirname(file));
    await vscode.window.showTextDocument(vscode.Uri.file(index));
  });
}

module.exports = {activate};
