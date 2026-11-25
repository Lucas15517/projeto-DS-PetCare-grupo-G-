'use strict';

const crypto = require('node:crypto');

module.exports = async function authRoutes(context) {
  const { route, method, req, send, store, auth, readJson, user } = context;

  if (route === '/api/health' && method === 'GET') {
    send(context.res, 200, {
      ok: true,
      storage: store.mode,
      timezone: 'America/Sao_Paulo'
    });
    return true;
  }

  if (route === '/api/services' && method === 'GET') {
    send(context.res, 200, store.listServices());
    return true;
  }

  if ((route === '/api/register' || route === '/api/login') && method === 'POST') {
    if (!auth.allowAttempt(req)) {
      send(context.res, 429, { error: 'Muitas tentativas. Aguarde um minuto.' });
      return true;
    }

    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (email.length > 160 || !/^\S+@\S+\.\S+$/.test(email) ||
        password.length < 8 || password.length > 128) {
      send(context.res, 400, {
        error: 'Informe um e-mail válido e uma senha de 8 a 128 caracteres.'
      });
      return true;
    }

    if (route === '/api/register') {
      const name = String(body.name || '').trim();
      if (name.length < 2 || name.length > 80) {
        send(context.res, 400, { error: 'Informe um nome entre 2 e 80 caracteres.' });
        return true;
      }
      if (store.findUserByEmail(email)) {
        send(context.res, 409, { error: 'E-mail já cadastrado.' });
        return true;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const created = store.createUser({
        name,
        email,
        salt,
        password_hash: auth.hashPassword(password, salt)
      });
      send(context.res, 201, {
        token: auth.createToken(created),
        user: auth.publicUser(created)
      });
      return true;
    }

    const found = store.findUserByEmail(email);
    const fakeHash = auth.hashPassword(password, '0'.repeat(32));
    const actualHash = found ? auth.hashPassword(password, found.salt) : fakeHash;
    const matches = found &&
      crypto.timingSafeEqual(
        Buffer.from(actualHash, 'hex'),
        Buffer.from(found.password_hash, 'hex')
      );
    if (!matches) {
      send(context.res, 401, { error: 'Credenciais inválidas.' });
      return true;
    }

    send(context.res, 200, {
      token: auth.createToken(found),
      user: auth.publicUser(found)
    });
    return true;
  }

  if (user && route === '/api/logout' && method === 'POST') {
    store.incrementTokenVersion(user.id);
    send(context.res, 200, { ok: true, message: 'Sessão encerrada no servidor.' });
    return true;
  }

  if (user && route === '/api/me' && method === 'GET') {
    send(context.res, 200, auth.publicUser(user));
    return true;
  }

  return false;
};
