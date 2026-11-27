import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import brief from '../assets/brief.js';

const modeNames = {operate: 'Operate', persuade: 'Persuade', read: 'Read'};
const accessNames = {
  public: 'Public', organization: 'Organization accounts', invited: 'Invited users', mixed: 'Public and private areas',
};
const loginNames = {none: 'No sign-in', hap: 'HAP sign-in', existing: 'Existing provider'};
const plain = text => text.replace(/\s+/g, ' ').replace(/[\\<>`*_\[\]]/g, '\\$&');

export async function writeHandoff(data, directory) {
  if (data.version !== 2) throw Error('Reopen this brief in the planner and complete the discovery questions first.');

  const tokens = brief.designTokens(data);
  const product = [
    '# Product', '<!-- impeccable:product-schema 1 -->',
    '## Platform\n\nweb',
    '## Users\n\n' + plain(data.audience),
    '## Product Purpose\n\n' + plain(data.task),
    '## Capabilities and Constraints\n\n' +
      (data.appName ? 'Existing HAP application: ' + plain(data.appName) : 'Standalone website.'),
    ...(data.brand ? ['## Brand Commitments\n\n' + plain(data.brand)] : []),
    ...(data.needs ? ['## Accessibility & Inclusion\n\n' + plain(data.needs)] : []),
  ];
  const design = [
    [
      '---', 'name: ' + JSON.stringify(data.project), 'description: "Initial visual direction from the approved brief"',
      'colors:',
      ...['canvas', 'panel', 'ink', 'accent', 'on-accent'].map(key => '  ' + key + ': ' + JSON.stringify(tokens[key])),
      '---',
    ].join('\n'),
    '# Design System',
    '## Overview\n\nInitial visual direction: ' + data.style + '.',
    '## Typography\n\nPreview font stack: ' + tokens.typeface + '.',
    '## Layout\n\nPreview density: ' + data.density + '. Refine the layout against approved reference screens.',
  ];
  const functionality = [
    '# Functionality',
    '## First surface\n\nMode: ' + modeNames[data.mode] + '.\n\nPrimary task: ' + plain(data.task),
    ...(data.pages ? ['## Pages\n\n' + plain(data.pages)] : []),
    '## Access\n\n- Policy: ' + accessNames[data.access] + '\n- Sign-in: ' + loginNames[data.login] +
      (data.loginNotes ? '\n- Provider to verify: ' + plain(data.loginNotes) : '') +
      (data.publicPages ? '\n- Public pages: ' + plain(data.publicPages) : '') +
      (data.permissions ? '\n- Role expectations: ' + plain(data.permissions) : ''),
    ...(data.features ? ['## Required workflows\n\n' +
      (data.scope === 'preserve' ? 'Preserve current website workflows.' : 'Implement the selected HAP workflows.') +
      '\n\n' + plain(data.features)] : []),
    '## Workflow mapping\n\nRecord one row for each approved action. Confirm HAP data, roles and existing side effects before implementation.\n\n' +
      '| Action | Current behavior | HAP data or operation | Allowed role | Result and failure | Browser verification |\n' +
      '| --- | --- | --- | --- | --- | --- |',
    '## Acceptance\n\n' + plain(data.acceptance),
  ];

  await mkdir(directory);
  await Promise.all([
    ['PRODUCT.md', product],
    ['DESIGN.md', design],
    ['FUNCTIONALITY.md', functionality],
  ].map(([name, blocks]) => writeFile(join(directory, name), blocks.join('\n\n') + '\n', {flag: 'wx', mode: 0o600})));
}
