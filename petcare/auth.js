'use strict';

const crypto = require('node:crypto');
const net = require('node:net');

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createAuth(store, secret) {
  const rateLimits = new Map();
  const windowMs = 60_000;
  const maxAttempts = 20;

  function clientIp(req) {
    if (process.env.TRUST_PROXY === '1') {
      const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      if (net.isIP(forwarded)) return forwarded;
    }
    return req.socket.remoteAddress || 'local';
  }

  function allowAttempt(req) {
    const ip = clientIp(req);
    const now = Date.now();
    const recent = (rateLimits.get(ip) || []).filter((time) => now - time < windowMs);
    if (recent.length >= maxAttempts) {
      rateLimits.set(ip, recent);
      return false;
    }
    recent.push(now);
    rateLimits.set(ip, recent);
    return true;
  }

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of rateLimits) {
      const recent = times.filter((time) => now - time < windowMs);
      if (recent.length) rateLimits.set(ip, recent);
      else rateLimits.delete(ip);
    }
  }, windowMs);
  cleanupTimer.unref?.();

  function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email };
  }

  function createToken(user) {
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    const nonce = crypto.randomBytes(16).toString('hex');
    const raw = [user.id, expiresAt, nonce, user.token_version].join('.');
    const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    return raw + '.' + signature;
  }

  function authenticate(req) {
    const header = String(req.headers.authorization || '');
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;

    const parts = match[1].split('.');
    if (parts.length !== 5) return null;

    const raw = parts.slice(0, 4).join('.');
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(parts[4]);
    if (expectedBuffer.length !== suppliedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) return null;

    const userId = Number(parts[0]);
    const expiresAt = Number(parts[1]);
    const tokenVersion = Number(parts[3]);
    if (!Number.isSafeInteger(userId) || !Number.isFinite(expiresAt) ||
        !Number.isSafeInteger(tokenVersion) || expiresAt <= Date.now()) return null;

    const user = store.getUserById(userId);
    if (!user || user.token_version !== tokenVersion) return null;
    return user;
  }

  return {
    hashPassword,
    publicUser,
    createToken,
    authenticate,
    allowAttempt,
    _testing: { rateLimits, clientIp }
  };
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 30_000) {
      const error = new Error('A requisição ultrapassou 30 KB.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('JSON inválido.');
    error.status = 400;
    throw error;
  }
}

module.exports = { createAuth, readJson };
