import {createServer} from 'node:http';
import {createDeskHandler, createHapAdapter} from './adapter.mjs';
import {requireUser, getProviderAccessToken} from './auth/index.mjs';

function worksheetMapping() {
  try {
    return JSON.parse(process.env.DESK_WORKSHEETS || '{}');
  } catch {
    return {};
  }
}

const handle = createDeskHandler({
  requireUser,
  providerToken: getProviderAccessToken,
  adapter: token => createHapAdapter({
    ...worksheetMapping(),
    token,
    base: process.env.HAP_API_BASE_URL,
  }),
});

createServer(handle).listen(Number(process.env.PORT || 80));
