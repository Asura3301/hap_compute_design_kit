'use strict';

const search = document.querySelector('#search');
const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const orders = document.querySelector('#orders');
const endpoint = document.querySelector('meta[name="dispatch-endpoint"]').content;
const samples = [
  {id: '1048', status: 'Awaiting pickup', window: '14:00–16:00', nextAction: 'Confirm the carrier’s arrival time.'},
  {id: '1049', status: 'Packing', window: '16:00–18:00', nextAction: 'Check the packed quantity.'},
];
let records = [];

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const matches = records.filter(record => (record.id + ' ' + record.status).toLowerCase().includes(query));
  status.textContent = matches.length ? matches.length + ' orders' :
    (query ? 'No matching orders.' : 'There are no orders to display.');
  orders.replaceChildren(...matches.map(record => {
    const details = document.createElement('details');
    const fields = document.createElement('dl');
    fields.append(element('dt', 'Pickup window'), element('dd', record.window),
      element('dt', 'Next action'), element('dd', record.nextAction));
    details.append(element('summary', 'Order ' + record.id + ' · ' + record.status), fields);
    return details;
  }));
}

async function load() {
  status.textContent = 'Loading orders…';
  retry.hidden = true;
  search.disabled = true;
  try {
    if (endpoint) {
      const url = new URL(endpoint, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) throw Error('Invalid adapter route.');
      const response = await fetch(url, {redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000)});
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          status.textContent = 'Orders are unavailable for this session. Check your sign-in and access.';
          return;
        }
        throw Error('Adapter request failed.');
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.some(record => !record ||
        ['id', 'status', 'window', 'nextAction'].some(field => typeof record[field] !== 'string'))) {
        throw Error('Invalid order response.');
      }
      records = data;
    } else {
      records = samples;
    }
    search.disabled = false;
    render();
  } catch {
    status.textContent = 'Could not load orders. Try again.';
    retry.hidden = false;
  }
}
search.addEventListener('input', render);
retry.addEventListener('click', load);
load();
