'use strict';

const requestedMode = process.env.PETCARE_STORAGE ||
  (process.env.NODE_ENV === 'production' ? 'sqlite' : 'json');

if (!['json', 'sqlite'].includes(requestedMode)) {
  throw new Error('PETCARE_STORAGE deve ser json ou sqlite.');
}

const store = requestedMode === 'sqlite'
  ? require('./sqlite-store')
  : require('./json-store');

module.exports = { ...store, mode: requestedMode };
