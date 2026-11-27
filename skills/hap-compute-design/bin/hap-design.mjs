#!/usr/bin/env node
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

async function listApps(org, origin) {
  if (!org || !origin || !process.env.HAP_PAT) throw Error('Укажите --org, --origin (официальный HTTPS-адрес API вашей организации) и переменную окружения HAP_PAT.');
  const host = new URL(origin);
  if (host.protocol !== 'https:' || host.origin !== origin) throw Error('--origin должен быть HTTPS origin без пути.');
  const url = new URL('/v3/apps/list', host);
  url.searchParams.set('orgId', org);
  url.searchParams.set('permissionScope', 'owner');
  const response = await fetch(url, {headers: {Authorization: 'Bearer ' + process.env.HAP_PAT}, redirect: 'error', signal: AbortSignal.timeout(15000)});
  if (!response.ok) throw Error('Ошибка доступа HAP, HTTP ' + response.status);
  const body = await response.json();
  if (!body.success) throw Error('HAP отклонил запрос. Проверьте организацию и права PAT.');
  const rows = Array.isArray(body.data) ? body.data : body.data?.apps;
  if (!Array.isArray(rows)) throw Error('Неизвестный формат списка приложений.');
  return rows.filter(a => a.isOwner !== false).map(a => {
    const id = a.appId ?? a.id, name = a.name ?? a.appName;
    if (!id || !name) throw Error('В ответе отсутствует идентификатор или имя приложения.');
    return {id, name};
  });
}

async function main() {
  const {positionals: [command], values} = parseArgs({allowPositionals:true, options:{org:{type:'string'}, origin:{type:'string'}}});
  if (!command || command === 'help') {
    console.log('hap-design new [--org ID --origin HTTPS_ORIGIN]\nhap-design apps --org ID --origin HTTPS_ORIGIN\nhap-design styles');
    return;
  }
  if (!['apps','new','styles'].includes(command)) throw Error('Неизвестная команда. См. hap-design help.');
  const apps = command === 'apps' || (command === 'new' && (values.org || values.origin))
    ? await listApps(values.org, values.origin) : [];
  if (command === 'apps') return console.log(JSON.stringify(apps,null,2));
  const template = await readFile(new URL('../assets/planner.html',import.meta.url),'utf8');
  const target = join(await mkdtemp(join(tmpdir(),'hap-design-')), 'planner.html');
  const options = apps.map(({id,name}) => '<option value="' + escapeHtml(id) + '">' + escapeHtml(name) + '</option>').join('');
  await writeFile(target,template.replace('<!-- APPS -->',() => options),{mode:0o600});
  console.log(pathToFileURL(target).href + (command === 'styles' ? '#appearance' : ''));
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
main().catch(error => {console.error(error.message); process.exitCode=1;});
