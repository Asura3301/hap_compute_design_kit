const get = id => document.getElementById(id);
const motion = new Set(['Picked up', 'Departed', 'Arrived', 'Customs']);
const nf = new Intl.NumberFormat('en', {maximumFractionDigits: 2});
const state = {items: [], total: 0, page: 1, pageSize: 40, selected: '', listRequest: 0, detailRequest: 0};
let computeFetch;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function badge(status) {
  return element('span', status || 'Unknown', status === 'Exception' ? 'badge alert' : 'badge');
}

function date(value) {
  if (!value) return '—';
  const day = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return day ? day + (value.match(/[T ](\d{2}:\d{2})/)?.[1] ? ' · ' + value.match(/[T ](\d{2}:\d{2})/)[1] : '') : value;
}

async function json(path) {
  const response = await computeFetch(path);
  if (!response.ok) {
    const messages = {
      401: 'Your session needs to be renewed.',
      403: 'Your HAP account cannot access these records.',
      404: 'This shipment is unavailable to your account.',
      409: 'HAP authorization is required. Sign in again with HAP and approve the requested access.',
      429: 'HAP is rate limiting requests. Wait briefly and refresh.',
    };
    throw Error(messages[response.status] ?? 'The shipment service is unavailable. Try refreshing.');
  }
  return response.json();
}

function renderQueue() {
  const query = get('search').value.trim().toLowerCase();
  const filter = get('filter').value;
  const matches = state.items.filter(order => (!filter || order.status === filter) &&
    [order.order, order.waybill, order.origin, order.destination].some(value => value?.toLowerCase().includes(query)));
  const fragment = document.createDocumentFragment();
  for (const order of matches) {
    const button = element('button', undefined, 'shipment');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(state.selected === order.id));
    button.dataset.shipment = order.id;
    const line = element('span', undefined, 'shipment-line');
    line.append(element('strong', order.order || order.waybill || 'Shipment'), badge(order.status));
    button.append(line, element('small', (order.origin || '—') + ' → ' + (order.destination || '—')));
    fragment.append(button);
  }
  get('shipments').replaceChildren(fragment);
  get('queue-status').textContent = matches.length + (matches.length === 1 ? ' shipment shown' : ' shipments shown');
  if (matches.length === 0) get('queue-status').textContent = query || filter ? 'No shipments match your filters.' : 'No shipments are visible on this page.';
  get('page-count').textContent = 'Page ' + state.page + ' of ' + Math.max(1, Math.ceil(state.total / state.pageSize));
  get('prev').disabled = state.page === 1;
  get('next').disabled = state.page * state.pageSize >= state.total;
}

function updateFilters() {
  const filter = get('filter');
  const selected = filter.value;
  filter.replaceChildren(new Option('All statuses', ''));
  const statuses = [...new Set(state.items.map(item => item.status))].sort();
  for (const name of statuses) filter.add(new Option(name, name));
  filter.value = statuses.includes(selected) ? selected : '';
}

async function load(page = state.page) {
  const request = ++state.listRequest;
  get('queue-status').textContent = 'Loading shipments…';
  get('refresh').disabled = true;
  get('prev').disabled = true;
  get('next').disabled = true;
  try {
    const data = await json('/api/shipments?page=' + page);
    if (request !== state.listRequest) return;
    Object.assign(state, {items: data.items, total: data.total, pageSize: data.pageSize, page});
    get('total').textContent = nf.format(state.total);
    get('motion').textContent = nf.format(state.items.filter(row => motion.has(row.status)).length);
    get('exceptions').textContent = nf.format(state.items.filter(row => row.status === 'Exception').length);
    get('last-update').textContent = 'Updated ' + new Intl.DateTimeFormat('en', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    }).format(new Date());
    updateFilters();
    renderQueue();
    const link = new URL(location.href).searchParams.get('shipment');
    if (link && /^[\w-]{1,80}$/.test(link)) await select(link, {updateUrl: false});
  } catch (error) {
    if (request === state.listRequest) get('queue-status').textContent = error.message;
  } finally {
    if (request === state.listRequest) get('refresh').disabled = false;
  }
}

function showDetail({item, events, timelineRestricted}) {
  get('detail-order').textContent = [item.order, item.waybill].filter(Boolean).join(' · ');
  get('detail-status').replaceChildren(badge(item.status));
  get('origin').textContent = item.origin || '—';
  get('destination').textContent = item.destination || '—';
  const values = {
    Pieces: item.pieces === null ? '—' : nf.format(item.pieces),
    'Chargeable weight': item.weight === null ? '—' : nf.format(item.weight) + ' kg',
    Pickup: date(item.pickup), Departure: date(item.departure),
    Arrival: date(item.arrival), Delivery: date(item.delivery),
  };
  get('facts').replaceChildren(...Object.entries(values).map(([label, value]) => {
    const field = element('div');
    field.append(element('dt', label), element('dd', value));
    return field;
  }));
  get('timeline-status').textContent = timelineRestricted ? 'Your HAP role cannot read operation history.' :
    (events.length ? '' : 'No operations are visible for this shipment.');
  get('timeline').replaceChildren(...events.map(event => {
    const entry = element('li', undefined, event.exception ? 'is-exception' : '');
    entry.append(element('strong', event.status + (event.exception && event.status !== 'Exception' ? ' · Exception' : '')), element('small', date(event.at)));
    return entry;
  }));
  get('detail-message').textContent = '';
  get('detail-body').hidden = false;
}

async function select(id, {updateUrl = true, focus = false} = {}) {
  const request = ++state.detailRequest;
  state.selected = id;
  for (const button of get('shipments').querySelectorAll('[data-shipment]')) {
    button.setAttribute('aria-pressed', String(button.dataset.shipment === id));
  }
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('shipment', id);
    history.replaceState(null, '', url);
  }
  get('detail-body').hidden = true;
  get('detail-status').replaceChildren();
  get('detail-message').textContent = 'Loading shipment detail…';
  if (focus) get('detail-title').focus();
  try {
    const data = await json('/api/shipments/' + encodeURIComponent(id));
    if (request === state.detailRequest) showDetail(data);
  } catch (error) {
    if (request === state.detailRequest) get('detail-message').textContent = error.message;
  }
}

async function start() {
  get('gate-message').textContent = 'Checking site access…';
  get('gate-retry').hidden = true;
  try {
    const sdk = await import('/__cauth/auth-client.js');
    await sdk.bootstrapSiteAccess();
    computeFetch = sdk.computeFetch;
    get('source').textContent = document.documentElement.hasAttribute('data-fixture') ? 'Sample data' : 'HAP workspace';
    get('gate').hidden = true;
    get('desk').hidden = false;
    await load();
  } catch {
    get('gate-message').textContent = 'Site access could not be verified.';
    get('gate-retry').hidden = false;
  }
}

get('detail-title').tabIndex = -1;
get('search').addEventListener('input', renderQueue);
get('filter').addEventListener('change', renderQueue);
get('refresh').addEventListener('click', () => load());
get('prev').addEventListener('click', () => load(state.page - 1));
get('next').addEventListener('click', () => load(state.page + 1));
get('gate-retry').addEventListener('click', start);
get('shipments').addEventListener('click', event => {
  const button = event.target.closest('[data-shipment]');
  if (button) select(button.dataset.shipment, {focus: matchMedia('(max-width: 780px)').matches});
});
start();
