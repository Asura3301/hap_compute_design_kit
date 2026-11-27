import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createDeskHandler} from '../apps/aerofreight/adapter.mjs';
import {fixtureAdapter} from './aerofreight-fixture.mjs';

test('maps the HAP schema, limits projection, and normalizes missing values', async () => {
  const adapter = fixtureAdapter({network: async (url, setup) => {
    assert.equal(url, 'https://fixture.invalid/api/v3/app/worksheets/orders/rows/list');
    assert.equal(setup.headers['HAP-Appid'], 'fixture');
    assert.equal(setup.headers.Authorization, 'Bearer fixture-operator');
    assert.equal(setup.redirect, 'error');
    const body = JSON.parse(setup.body);
    assert.equal(body.pageIndex, 2);
    assert.equal(body.pageSize, 40);
    assert.ok(body.fields.includes('biz_destination_airport'));
    assert.ok(!body.fields.includes('biz_received_amount'));
    return Response.json({success: true, data: {rows: [
      {rowId: 'row-1', biz_billable_weight: '0', biz_destination_airport: [{name: 'FRA'}],
        biz_origin_airport: [], biz_status: [{value: '起飞'}], secret: 'private data'},
    ], total: 60}});
  }});
  const result = await adapter.shipments(2);
  assert.deepEqual(result, {total: 60, pageSize: 40, items: [
    {id: 'row-1', order: '', waybill: '', status: 'Departed', origin: '', destination: 'FRA',
      pieces: null, weight: 0, pickup: '', departure: '', arrival: '', delivery: ''},
  ]});
});

test('filters timelines by order and preserves restricted views', async () => {
  const operator = fixtureAdapter();
  const limited = fixtureAdapter({role: 'limited'});
  assert.equal((await operator.shipment('desk-1048')).events.length, 2);
  assert.equal((await limited.shipments(1)).total, 1);
  assert.equal((await limited.shipment('desk-1048')).timelineRestricted, true);
  await assert.rejects(limited.shipment('desk-1049'), {status: 404, code: 'shipment_not_found'});
});

test('denies anonymous access and never starts an upstream request', async () => {
  const handle = createDeskHandler({
    requireUser: async () => ({id: null}),
    providerToken: async () => { throw Error('Authentication must short-circuit'); },
  });
  const writes = [];
  await handle({method: 'GET', url: '/api/shipments'}, {
    writeHead: (...args) => writes.push(args), end: data => writes.push(JSON.parse(data)),
  });
  assert.equal(writes[0][0], 401);
  assert.equal(writes[0][1]['Cache-Control'], 'no-store');
  assert.equal(writes[1].code, 'sign_in_required');
});

test('validates routes and reports reauthorization on upstream denial', async () => {
  const handle = createDeskHandler({
    requireUser: async () => ({id: 'test-user', provider: 'fixture'}),
    providerToken: async () => ({accessToken: 'fixture'}),
    adapter: () => fixtureAdapter(),
  });
  async function call(url, method = 'GET') {
    const result = {};
    await handle({url, method}, {
      writeHead: status => { result.status = status; },
      end: data => { result.body = JSON.parse(data); },
    });
    return result;
  }
  assert.equal((await call('/api/shipments?page=0')).status, 400);
  assert.equal((await call('/api/shipments', 'POST')).status, 405);
  assert.equal((await call('/api/shipments')).body.total, 6);
  const expired = fixtureAdapter({network: async () => new Response(null, {status: 401})});
  await assert.rejects(expired.shipments(1), {status: 409, code: 'provider_reauthorization_required'});
});
