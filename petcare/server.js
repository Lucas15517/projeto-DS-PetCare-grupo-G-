'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const store = require('./db');
const { createAuth, readJson } = require('./auth');
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const appointmentRoutes = require('./routes/appointments');
const careRoutes = require('./routes/care');

if (process.env.NODE_ENV === 'production' &&
    (!process.env.PETCARE_SECRET || process.env.PETCARE_SECRET.length < 32)) {
  throw new Error('Configure PETCARE_SECRET com pelo menos 32 caracteres.');
}
const secret = process.env.PETCARE_SECRET || crypto.randomBytes(32).toString('hex');
const auth = createAuth(store, secret);

function send(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function validDate(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (calendarDate.toISOString().slice(0, 10) !== date) return false;

  // Horários informados pelo usuário são interpretados no fuso de Brasília.
  const appointmentInstant = new Date(date + 'T' + time + ':00-03:00');
  return Number.isFinite(appointmentInstant.getTime()) &&
    appointmentInstant.getTime() > Date.now();
}

const publicDirectory = path.join(__dirname, 'public');
const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json; charset=utf-8'],
  '/sw.js': ['sw.js', 'text/javascript; charset=utf-8'],
  '/icon.svg': ['icon.svg', 'image/svg+xml'],
  '/offline.html': ['offline.html', 'text/html; charset=utf-8']
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname;
    const method = req.method;

    if (!route.startsWith('/api/')) {
      if (method !== 'GET' || !assets[route]) {
        res.writeHead(404, { 'X-Content-Type-Options': 'nosniff' });
        return res.end('Não encontrado');
      }

      const [filename, contentType] = assets[route];
      res.writeHead(200, {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'",
        'Cache-Control': route === '/sw.js' ? 'no-cache' : 'public, max-age=300',
        ...(route === '/sw.js' ? { 'Service-Worker-Allowed': '/' } : {})
      });
      return fs.createReadStream(path.join(publicDirectory, filename)).pipe(res);
    }

    const context = {
      req, res, url, route, method, send, store, auth, readJson, validDate
    };

    // Rotas públicas: saúde, serviços, cadastro e login.
    if (await authRoutes(context)) return;

    const user = auth.authenticate(req);
    if (!user) return send(res, 401, { error: 'Faça login novamente.' });

    context.user = user;
    // Rotas autenticadas de sessão, pets, agendamentos e orientações.
    if (await authRoutes(context)) return;
    if (await petRoutes(context)) return;
    if (await appointmentRoutes(context)) return;
    if (await careRoutes(context)) return;

    return send(res, 404, { error: 'Rota não encontrada.' });
  } catch (error) {
    if (!res.headersSent) {
      const status = Number.isInteger(error.status) ? error.status : 500;
      if (status === 500) console.error('Erro interno no PetCare:', error);
      return send(res, status, {
        error: status === 500 ? 'Erro interno no servidor.' : error.message
      });
    }
    res.destroy();
  }
});

function start() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST ||
    (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  server.listen(port, host, () => {
    console.log('PetCare iniciado em ' + host + ':' + port + ' (' + store.mode + ').');
  });
}

if (require.main === module) start();

module.exports = {
  server,
  start,
  store,
  _testing: auth._testing
};
