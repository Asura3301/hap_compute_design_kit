import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createDeskHandler, createHapAdapter} from '../apps/aerofreight/adapter.mjs';

const shipments = [
  ['desk-1048', 'AF-1048', 'PVG', 'FRA', '起飞', '980'],
  ['desk-1049', 'AF-1049', 'HKG', 'AMS', '异常', '1240'],
  ['desk-1050', 'AF-1050', 'ICN', 'SIN', '清关', '610'],
  ['desk-1051', 'AF-1051', 'NRT', 'ORD', '已提货', '760'],
  ['desk-1052', 'AF-1052', 'LHR', 'DXB', '完成', '470'],
  ['desk-1053', 'AF-1053', 'DOH', 'MAD', '未提货', '520'],
].map(([rowId, order, from, to, status, weight], i) => ({
  rowId, biz_order_no: order, biz_waybill_no: 'SAMPLE-' + (100 + i),
  biz_origin_airport: [{name: from}], biz_destination_airport: [{name: to}],
  biz_status: [{value: status}], biz_pieces: String(4 + i), biz_billable_weight: weight,
  biz_pickup_date: '2026-11-26', biz_departure_date: '2026-11-27',
  biz_arrival_date: '2026-11-28', biz_delivery_date: '2026-11-29', private_test_field: 'omitted',
}));
const events = [
  {biz_status: [{value: '起飞'}], biz_operation_time: '2026-11-27 16:35', biz_is_exception: false},
  {biz_status: [{value: '已提货'}], biz_operation_time: '2026-11-26 09:12', biz_is_exception: false},
];
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/desk.css', ['desk.css', 'text/css']],
  ['/desk.mjs', ['desk.mjs', 'application/javascript']],
  ['/logo.png', ['logo.png', 'image/png']],
]);

export function fixtureAdapter({role = 'operator', network} = {}) {
  return createHapAdapter({
    base: 'https://fixture.invalid/api', appId: 'fixture', orders: 'orders', operations: 'operations',
    token: 'fixture-' + role,
    request: network ?? (async (url, request) => {
      const body = JSON.parse(request.body);
      const visible = role === 'operator' ? shipments : shipments.slice(0, 1);
      const order = visible.find(row => row.rowId === body.filter?.value);
      const activity = url.endsWith('/operations/rows/list');
      if (activity && role === 'limited') return new Response(null, {status: 403});
      const rows = activity ? order ? events : [] : body.filter ? order ? [order] : [] : visible;
      return Response.json({success: true, data: {rows, total: visible.length}});
    }),
  });
}

export async function startFixture({port = 0, role = 'operator', allowBootstrap = Promise.resolve()} = {}) {
  const handle = createDeskHandler({
    requireUser: async () => ({id: 'fixture-user', provider: 'fixture'}),
    providerToken: async () => ({accessToken: 'fixture-' + role}),
    adapter: () => fixtureAdapter({role}),
  });
  const server = createServer(async (req, res) => {
    const {pathname} = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/api/')) return handle(req, res);
    if (pathname === '/__cauth/auth-client.js') {
      await allowBootstrap;
      return res.writeHead(200, {'Content-Type': 'application/javascript'}).end(
        'export async function bootstrapSiteAccess() {} export const computeFetch = fetch;',
      );
    }
    const asset = assets.get(pathname);
    if (!asset) return res.writeHead(404).end();
    try {
      const file = await readFile(new URL('../apps/aerofreight/public/' + asset[0], import.meta.url));
      const body = pathname === '/' ? file.toString().replace('<html lang="en">', '<html lang="en" data-fixture>') : file;
      return res.writeHead(200, {'Content-Type': asset[1]}).end(body);
    } catch {
      return res.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return {url: 'http://127.0.0.1:' + server.address().port, close: () => new Promise(resolve => server.close(resolve))};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const role = process.argv.includes('--limited') ? 'limited' : 'operator';
  startFixture({port: 4173, role}).then(({url}) => console.log('AeroFreight sample workspace: ' + url))
    .catch(error => {console.error(error.message); process.exitCode = 1;});
}
