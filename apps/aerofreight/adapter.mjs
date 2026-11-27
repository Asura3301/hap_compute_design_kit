const translations = new Map([
  ['草稿', 'Draft'], ['待报价', 'Awaiting quote'], ['待确认', 'Awaiting confirmation'],
  ['未提货', 'Awaiting pickup'], ['已提货', 'Picked up'], ['起飞', 'Departed'],
  ['到港', 'Arrived'], ['清关', 'Customs'], ['送达', 'Delivered'], ['完成', 'Completed'],
  ['异常', 'Exception'], ['取消', 'Cancelled'],
]);

const orderFields = [
  'biz_order_no', 'biz_waybill_no', 'biz_status', 'biz_origin_airport', 'biz_destination_airport',
  'biz_pieces', 'biz_billable_weight', 'biz_pickup_date', 'biz_departure_date',
  'biz_arrival_date', 'biz_delivery_date',
];
const eventFields = ['biz_status', 'biz_operation_time', 'biz_is_exception'];
const pageSize = 40;
const rowId = row => row.rowId || row._id;
const string = value => typeof value === 'string' ? value.trim().slice(0, 160) : '';
const number = value => typeof value === 'number' || (typeof value === 'string' && value.trim())
  ? (Number.isFinite(Number(value)) ? Number(value) : null)
  : null;
const status = value => {
  const label = string(Array.isArray(value) ? value[0]?.value : value);
  return (translations.get(label) ?? label) || 'Unknown';
};
const airport = value => string(Array.isArray(value) ? value[0]?.name : value);
const recordId = value => typeof value === 'string' && /^[\w-]{1,80}$/.test(value);

class DeskError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function toOrder(row) {
  return {
    id: rowId(row), order: string(row.biz_order_no), waybill: string(row.biz_waybill_no),
    status: status(row.biz_status), origin: airport(row.biz_origin_airport),
    destination: airport(row.biz_destination_airport), pieces: number(row.biz_pieces),
    weight: number(row.biz_billable_weight), pickup: string(row.biz_pickup_date),
    departure: string(row.biz_departure_date), arrival: string(row.biz_arrival_date),
    delivery: string(row.biz_delivery_date),
  };
}

function toEvent(row) {
  return {
    status: status(row.biz_status), at: string(row.biz_operation_time),
    exception: [true, 1, '1', 'true'].includes(row.biz_is_exception),
  };
}

function apiBase(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new DeskError(503, 'hap_configuration_missing');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new DeskError(503, 'hap_configuration_invalid');
  }
  return url.href.replace(/\/$/, '');
}

export function createHapAdapter({base, appId, orders, operations, token, request = fetch}) {
  if (![appId, orders, operations].every(recordId)) throw new DeskError(503, 'hap_configuration_missing');
  const endpoint = apiBase(base);

  async function rows(worksheet, body) {
    const response = await request(endpoint + '/v3/app/worksheets/' + worksheet + '/rows/list', {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(12000),
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + token, 'HAP-Appid': appId},
      body: JSON.stringify({useFieldIdAsKey: false, responseFormat: 'json', ...body}),
    });
    if (response.status === 401) throw new DeskError(409, 'provider_reauthorization_required');
    if (response.status === 403) throw new DeskError(403, 'hap_access_denied');
    if (response.status === 429) throw new DeskError(429, 'hap_rate_limit');
    if (!response.ok) throw new DeskError(502, 'hap_unavailable');
    const payload = await response.json();
    if (payload?.error_code === 600320) throw new DeskError(403, 'hap_access_denied');
    if ([600207, 600208, 600209, 600312].includes(payload?.error_code)) {
      throw new DeskError(409, 'provider_reauthorization_required');
    }
    if (payload?.success !== true || !Array.isArray(payload.data?.rows)) {
      throw new DeskError(502, 'hap_unavailable');
    }
    return payload.data;
  }

  return {
    async shipments(page) {
      const result = await rows(orders, {
        pageIndex: page, pageSize, fields: orderFields, includeTotalCount: true,
        sorts: [{field: '_updatedAt', isAsc: false}],
      });
      const total = Number(result.total);
      if (!Number.isSafeInteger(total) || total < 0) throw new DeskError(502, 'hap_unavailable');
      return {items: result.rows.filter(row => row && recordId(rowId(row))).map(toOrder), total, pageSize};
    },
    async shipment(id) {
      const result = await rows(orders, {
        pageIndex: 1, pageSize: 1, fields: orderFields,
        filter: {type: 'condition', field: 'rowid', operator: 'eq', value: id},
      });
      const order = result.rows.find(row => row && rowId(row) === id);
      if (!order) throw new DeskError(404, 'shipment_not_found');
      try {
        const events = await rows(operations, {
          pageIndex: 1, pageSize: 30, fields: eventFields,
          filter: {type: 'condition', field: 'biz_order', operator: 'eq', value: id},
          sorts: [{field: 'biz_operation_time', isAsc: false}],
        });
        return {item: toOrder(order), events: events.rows.filter(Boolean).map(toEvent)};
      } catch (error) {
        if (error?.status !== 403) throw error;
        return {item: toOrder(order), events: [], timelineRestricted: true};
      }
    },
  };
}

export function createDeskHandler({requireUser, providerToken, adapter}) {
  return async function handle(req, res) {
    function send(status, data) {
      res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(JSON.stringify(data));
    }

    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method !== 'GET') return send(405, {code: 'method_not_allowed'});
      const match = url.pathname.match(/^\/api\/shipments(?:\/([\w-]{1,80}))?$/);
      if (!match) return send(404, {code: 'route_not_found'});
      const page = Number(url.searchParams.get('page') ?? 1);
      if (!Number.isInteger(page) || page < 1 || page > 10000) return send(400, {code: 'invalid_page'});

      const user = await requireUser(req, res);
      if (!user) return;
      if (!user.id) return send(401, {code: 'sign_in_required'});
      const {accessToken} = await providerToken(req, user.provider);
      if (typeof accessToken !== 'string' || !accessToken) return send(409, {code: 'provider_reauthorization_required'});
      const source = adapter(accessToken);
      return send(200, match[1] ? await source.shipment(match[1]) : await source.shipments(page));
    } catch (error) {
      const safe = new Set(['provider_reauthorization_required', 'provider_api_not_supported',
        'hap_configuration_missing', 'hap_configuration_invalid', 'hap_access_denied',
        'hap_rate_limit', 'hap_unavailable', 'shipment_not_found']);
      const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
        ? error.status : 502;
      return send(status, {code: safe.has(error?.code) ? error.code :
        (status === 409 ? 'provider_reauthorization_required' : 'hap_unavailable')});
    }
  };
}
